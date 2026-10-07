"""
optimizer_service.py - Motor de Optimización de Corte 1D con Google OR-Tools (Python CP-SAT)
Para Tubos y Perfiles Estructurales Stulz.

Uso:
  1. Test directo:
     python optimizer_service.py --test

  2. Servidor API local para la app Vue:
     python optimizer_service.py --serve
"""

import sys
import json
import time
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model

def solve_cutting_stock_ortools(
    cortes: List[Dict[str, Any]],
    bar_lengths: List[Dict[str, Any]],
    kerf: float = 3.5,
    retal_minimo: float = 500.0,
    max_seconds: float = 5.0
) -> Dict[str, Any]:
    """
    Resuelve el Cutting Stock Problem 1D con el solver CP-SAT de Google OR-Tools.
    Encuentra la solución matemáticamente óptima global (mínimo desperdicio / coste).
    Clasifica los sobrantes en:
      - Chatarra / Merma Inservible (< retal_minimo)
      - Retales Reutilizables Guardados (>= retal_minimo)
    """
    t0 = time.time()
    
    # Normalizar piezas y filtrar longitud > 0
    items = []
    total_util_mm = 0
    for idx, c in enumerate(cortes):
        length = int(round(float(c.get('longitud', 0))))
        if length > 0:
            items.append({
                'idx': idx,
                'id': c.get('id', str(idx)),
                'of': c.get('of', c.get('numero', '')),
                'norden_padre': c.get('norden_padre', 'Sin Batería'),
                'length': length
            })
            total_util_mm += length

    if not items:
        return {'error': 'No hay piezas para cortar'}

    # Ordenar candidatos de barra disponibles
    sorted_bar_types = sorted(bar_lengths, key=lambda b: b['length'])
    max_single_bar = max(b['length'] for b in sorted_bar_types)

    # Verificar que ninguna pieza sea mayor que la barra más grande
    for it in items:
        if it['length'] + kerf > max_single_bar:
            return {'error': f"La pieza de {it['length']}mm excede la barra más larga disponible ({max_single_bar}mm)"}

    # Cota superior de barras necesarias (peor caso: 1 barra por cada pieza)
    num_items = len(items)
    
    # Creamos un conjunto de barras candidatas
    candidate_bars = []
    bar_id_counter = 0
    for b in sorted_bar_types:
        limit = min(num_items, int(num_items * (b['length'] / (total_util_mm / num_items + 1))) + 2)
        limit = max(limit, 4)
        for _ in range(limit):
            candidate_bars.append({
                'id': bar_id_counter,
                'length': int(round(b['length'])),
                'cost': float(b.get('cost', 0))
            })
            bar_id_counter += 1

    num_bars = len(candidate_bars)

    # 1. Crear el Modelo CP-SAT de Google
    model = cp_model.CpModel()

    # x[i, j] = 1 si la pieza i se corta de la barra candidata j
    x = {}
    for i in range(num_items):
        for j in range(num_bars):
            x[i, j] = model.NewBoolVar(f'x_{i}_{j}')

    # y[j] = 1 si la barra candidata j es utilizada
    y = {}
    for j in range(num_bars):
        y[j] = model.NewBoolVar(f'y_{j}')

    # Restricción 1: Cada pieza i debe cortarse exactamente en una barra
    for i in range(num_items):
        model.Add(sum(x[i, j] for j in range(num_bars)) == 1)

    # Restricción 2: La suma de longitudes + kerf en cada barra j no puede exceder su capacidad
    for j in range(num_bars):
        capacidad = candidate_bars[j]['length']
        piezas_en_j = []
        for i in range(num_items):
            piezas_en_j.append(x[i, j] * int(round(items[i]['length'] + kerf)))
        
        model.Add(sum(piezas_en_j) <= capacidad * y[j])

    # Función Objetivo: Minimizar material bruto total consumido (o coste económico si está definido)
    coste_total_vars = []
    for j in range(num_bars):
        peso = int(candidate_bars[j]['cost'] * 100) if candidate_bars[j]['cost'] > 0 else candidate_bars[j]['length']
        coste_total_vars.append(y[j] * peso)

    model.Minimize(sum(coste_total_vars))

    # 2. Configurar y Ejecutar Solver CP-SAT
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_seconds
    solver.parameters.num_workers = 4  # Paralelismo multinúcleo
    
    status = solver.Solve(model)
    calc_time_ms = round((time.time() - t0) * 1000, 2)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            'error': 'No se encontró solución factible',
            'status': solver.StatusName(status)
        }

    # 3. Formatear la solución
    resultado_barras = []
    total_bruto_mm = 0
    total_desperdicio_mm = 0
    total_chatarra_mm = 0
    total_retales_mm = 0
    retales_count = 0
    total_coste = 0.0
    desglose_barras = {}
    bar_counter = 1

    for j in range(num_bars):
        if solver.Value(y[j]) == 1:
            cuts_in_bar = []
            used_mm = 0
            for i in range(num_items):
                if solver.Value(x[i, j]) == 1:
                    cuts_in_bar.append({
                        'length': items[i]['length'],
                        'orderId': items[i]['of'],
                        'norden_padre': items[i]['norden_padre']
                    })
                    used_mm += items[i]['length'] + kerf

            bar_len = candidate_bars[j]['length']
            bar_cost = candidate_bars[j]['cost']
            desp = max(0, bar_len - used_mm)
            
            total_bruto_mm += bar_len
            total_desperdicio_mm += desp
            total_coste += bar_cost
            desglose_barras[str(bar_len)] = desglose_barras.get(str(bar_len), 0) + 1

            no_aprovechar_retales = (retal_minimo <= 0)
            es_retal = (not no_aprovechar_retales) and (desp >= retal_minimo)
            es_chatarra = (desp > 0) and (no_aprovechar_retales or desp < retal_minimo)
            if desp > 0:
                if es_retal:
                    total_retales_mm += desp
                    retales_count += 1
                else:
                    total_chatarra_mm += desp

            resultado_barras.append({
                'id': str(bar_counter),
                'isNew': True,
                'originalLength': bar_len,
                'used': used_mm,
                'desperdicio': desp,
                'remaining': desp,
                'retalMinimo': retal_minimo,
                'newScrapGenerated': es_retal,
                'esRetalAprovechable': es_retal,
                'esChatarra': es_chatarra,
                'cuts': cuts_in_bar
            })
            bar_counter += 1

    pct_desperdicio = round((total_desperdicio_mm / total_bruto_mm) * 100, 1) if total_bruto_mm > 0 else 0.0
    pct_chatarra = round((total_chatarra_mm / total_bruto_mm) * 100, 1) if total_bruto_mm > 0 else 0.0
    pct_retales = round((total_retales_mm / total_bruto_mm) * 100, 1) if total_bruto_mm > 0 else 0.0

    return {
        'algoritmo': 'Google OR-Tools CP-SAT (Python Solver)',
        'idAlgoritmo': 'ortools',
        'esOptimoGlobal': (status == cp_model.OPTIMAL),
        'estadoSolver': solver.StatusName(status),
        'tiempoMs': calc_time_ms,
        'tubos': resultado_barras,
        'totalTubos': len(resultado_barras),
        'totalCortes': len(items),
        'totalMetrosUtiles': f"{total_util_mm / 1000:.2f}",
        'totalMetrosBrutos': f"{total_bruto_mm / 1000:.2f}",
        'totalMetrosBrutosMM': total_bruto_mm,
        'totalDesperdicio': total_desperdicio_mm,
        'totalDesperdicioM': f"{total_desperdicio_mm / 1000:.2f}",
        'porcentajeDesperdicio': f"{pct_desperdicio:.1f}",
        # Métricas de Umbral de Retal vs Merma Inservible
        'retalMinimo': retal_minimo,
        'totalChatarraMM': total_chatarra_mm,
        'totalChatarraM': f"{total_chatarra_mm / 1000:.2f}",
        'porcentajeChatarra': f"{pct_chatarra:.1f}",
        'totalRetalesGeneradosMM': total_retales_mm,
        'totalRetalesGeneradosM': f"{total_retales_mm / 1000:.2f}",
        'porcentajeRetalesGenerados': f"{pct_retales:.1f}",
        'retalesGeneradosCount': retales_count,
        'tubosMezclados': sum(1 for b in resultado_barras if len(set(c['norden_padre'] for c in b['cuts'] if c['norden_padre'] != 'Sin Batería')) > 1),
        'costeTotal': total_coste,
        'desgloseBarras': desglose_barras
    }

# -------------------------------------------------------------
# Test de demostración
# -------------------------------------------------------------
def run_test():
    print("=" * 60)
    print("PROBANDO MOTOR GOOGLE OR-TOOLS (PYTHON CP-SAT)")
    print("=" * 60)

    cortes = []
    for _ in range(8):
        cortes.append({'of': 'OF-3760', 'norden_padre': 'BAT-01', 'longitud': 3760})
    for _ in range(8):
        cortes.append({'of': 'OF-3650', 'norden_padre': 'BAT-02', 'longitud': 3650})
    for _ in range(8):
        cortes.append({'of': 'OF-2450', 'norden_padre': 'BAT-03', 'longitud': 2450})

    bar_lengths = [
        {'length': 4000, 'cost': 0},
        {'length': 6000, 'cost': 0},
        {'length': 7000, 'cost': 0},
        {'length': 8000, 'cost': 0}
    ]

    print(f"Total piezas a optimizar: {len(cortes)}")
    res = solve_cutting_stock_ortools(cortes, bar_lengths, kerf=3.5, retal_minimo=500.0, max_seconds=3.0)

    print("\nRESULTADOS:")
    print(f"Estado del Solver: {res['estadoSolver']} (Óptimo Matemático: {res['esOptimoGlobal']})")
    print(f"Tiempo de cálculo: {res['tiempoMs']} ms")
    print(f"Barras necesarias: {res['totalTubos']}")
    print(f"Metros lineales útiles: {res['totalMetrosUtiles']} m")
    print(f"Metros brutos consumidos: {res['totalMetrosBrutos']} m")
    print(f"Desperdicio total bruto: {res['totalDesperdicioM']} m ({res['porcentajeDesperdicio']}%)")
    print(f"  -- Merma Real (Chatarra < {res['retalMinimo']}mm): {res['totalChatarraM']} m ({res['porcentajeChatarra']}%)")
    print(f"  -- Retales Guardados (>= {res['retalMinimo']}mm): {res['totalRetalesGeneradosM']} m ({res['retalesGeneradosCount']} retales)")
    print(f"Desglose de barras a pedir: {res['desgloseBarras']}")
    print("=" * 60)

# -------------------------------------------------------------
# Microservicio FastAPI
# -------------------------------------------------------------
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    app = FastAPI(title="Stulz Colector Cutting Optimizer (Google OR-Tools)")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class OptimizeRequest(BaseModel):
        cortes: List[Dict[str, Any]]
        bar_lengths: List[Dict[str, Any]]
        kerf: float = 3.5
        retal_minimo: float = 500.0
        max_seconds: float = 5.0

    @app.get("/health")
    def health():
        return {"status": "ok", "solver": "Google OR-Tools CP-SAT", "version": "9.15"}

    @app.post("/optimize")
    def optimize_endpoint(req: OptimizeRequest):
        return solve_cutting_stock_ortools(
            cortes=req.cortes,
            bar_lengths=req.bar_lengths,
            kerf=req.kerf,
            retal_minimo=req.retal_minimo,
            max_seconds=req.max_seconds
        )

except ImportError:
    app = None

if __name__ == '__main__':
    if '--serve' in sys.argv:
        import uvicorn
        print("Iniciando microservicio de optimización en http://localhost:8000 ...")
        uvicorn.run("optimizer_service:app", host="127.0.0.1", port=8000, reload=False)
    else:
        run_test()
