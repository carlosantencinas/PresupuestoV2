import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Info as InfoIcon,
  Close as CloseIcon,
  Add as AddIcon
} from "@mui/icons-material";
import ItemSelectionDialog from "../components/ItemSelectionDialog";
import { formatNumber } from "../utils/formatUtils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const COLORS_MATERIALES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const COLORS_MANO_OBRA = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#d0ed57", "#a4de6c"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper sx={{ padding: 1 }}>
        <Typography variant="body2" fontWeight="bold">{data.name}</Typography>
        <Typography variant="body2">Costo: Bs. {formatNumber(data.value)}</Typography>
        <Typography variant="body2">Cantidad: {data.cantidad}</Typography>
      </Paper>
    );
  }
  return null;
};

export default function CalculationsSheet({ 
  presupuestoData,
  materialesData,
  manoObraData,
  selectedMaterial,
  selectedManoObra,
  selectedItems,
  onSelectItems,
  onSelectMaterial,
  onSelectManoObra
}) {
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  
  const findCostColumnIndex = useCallback((headers) => {
    if (!headers) return -1;
    return headers.findIndex(header => 
      header && typeof header === 'string' && 
      (header.toUpperCase().includes("COSTO") || 
       header.toUpperCase().includes("PRECIO") ||
       header.toUpperCase().includes("TOTAL") ||
       header.toUpperCase().includes("IMPORTE"))
    );
  }, []);

  const parseNumber = useCallback((value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/,/g, '.').replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }, []);

  const tiposIndex = useMemo(() => 
    presupuestoData.headers?.findIndex(h => 
      h && typeof h === 'string' && h.toUpperCase().includes("TIPO")) ?? -1,
    [presupuestoData.headers]
  );
  
  const costoIndex = useMemo(() => findCostColumnIndex(presupuestoData.headers), 
    [presupuestoData.headers, findCostColumnIndex]
  );
  
  const materialesCostoIndex = useMemo(() => 
    findCostColumnIndex(materialesData.asignacion.headers),
    [materialesData.asignacion.headers, findCostColumnIndex]
  );
  
  const manoObraCostoIndex = useMemo(() => 
    findCostColumnIndex(manoObraData.asignacion.headers),
    [manoObraData.asignacion.headers, findCostColumnIndex]
  );

  const filteredPresupuestoRows = useMemo(() => {
    let filteredRows = presupuestoData.rows || [];
    
    if (selectedItems && selectedItems.length > 0) {
      filteredRows = filteredRows.filter(row => selectedItems.includes(row[0]));
    } else {
      if (selectedMaterial) {
        const itemsConMaterial = new Set(
          (materialesData.asignacion.rows || [])
            .filter(row => row[0] === selectedMaterial)
            .map(row => row[1])
        );
        filteredRows = filteredRows.filter(row => itemsConMaterial.has(row[0]));
      }
      
      if (selectedManoObra) {
        const itemsConManoObra = new Set(
          (manoObraData.asignacion.rows || [])
            .filter(row => row[0] === selectedManoObra)
            .map(row => row[1])
        );
        filteredRows = filteredRows.filter(row => itemsConManoObra.has(row[0]));
      }
    }
    
    return filteredRows;
  }, [presupuestoData.rows, selectedItems, selectedMaterial, selectedManoObra, materialesData, manoObraData]);

  const filteredItemIds = useMemo(() => {
    return new Set(filteredPresupuestoRows.map(row => row[0]));
  }, [filteredPresupuestoRows]);

  const { totalMat, totalMO, materialesDetalle } = useMemo(() => {
    let totalMat = 0;
    let totalMO = 0;
    const materialesDetalle = {};
    const manoObraDetalle = {};

    if (materialesCostoIndex >= 0) {
      (materialesData.asignacion.rows || []).forEach(row => {
        if (filteredItemIds.has(row[1])) {
          const costo = parseNumber(row[materialesCostoIndex]);
          totalMat += costo;
          
          const material = row[0];
          if (!materialesDetalle[material]) {
            materialesDetalle[material] = { costo: 0, cantidad: 0 };
          }
          materialesDetalle[material].costo += costo;
          materialesDetalle[material].cantidad += 1;
        }
      });
    }

    if (manoObraCostoIndex >= 0) {
      (manoObraData.asignacion.rows || []).forEach(row => {
        if (filteredItemIds.has(row[1])) {
          const costo = parseNumber(row[manoObraCostoIndex]);
          totalMO += costo;
          
          const manoObra = row[0];
          if (!manoObraDetalle[manoObra]) {
            manoObraDetalle[manoObra] = { costo: 0, cantidad: 0 };
          }
          manoObraDetalle[manoObra].costo += costo;
          manoObraDetalle[manoObra].cantidad += 1;
        }
      });
    }

    return { totalMat, totalMO, materialesDetalle, manoObraDetalle };
  }, [
    materialesData.asignacion.rows, 
    manoObraData.asignacion.rows,
    materialesCostoIndex,
    manoObraCostoIndex,
    filteredItemIds,
    parseNumber
  ]);

  const { totalPresupuesto, chartData } = useMemo(() => {
    let total = 0;
    const data = [];

    if (tiposIndex >= 0 && costoIndex >= 0) {
      const dataByType = {};
      filteredPresupuestoRows.forEach(row => {
        const type = row[tiposIndex] || "Sin tipo";
        const costo = parseNumber(row[costoIndex]);
        
        if (!dataByType[type]) {
          dataByType[type] = { type, costo: 0, count: 0 };
        }
        
        dataByType[type].costo += costo;
        dataByType[type].count += 1;
        total += costo;
      });
      
      Object.values(dataByType).forEach(item => {
        data.push({
          name: item.type,
          value: item.costo,
          count: item.count,
          percentage: total > 0 ? (item.costo / total) * 100 : 0
        });
      });
    }

    return { totalPresupuesto: total, chartData: data };
  }, [filteredPresupuestoRows, tiposIndex, costoIndex, parseNumber]);

  const nombresMateriales = useMemo(() => {
    if (!materialesData.catalogo?.rows) return {};
    return Object.fromEntries(
      materialesData.catalogo.rows.map(row => [String(row[0]).trim(), row[1]])
    );
  }, [materialesData.catalogo?.rows]);

  const materialesChartData = useMemo(() => {
    return Object.entries(materialesDetalle)
      .map(([codigo, data]) => {
        const codeStr = String(codigo).trim();
        return {
          codigo: codeStr,
          name: nombresMateriales[codeStr] || codeStr,
          value: data.costo,
          cantidad: data.cantidad
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [materialesDetalle, nombresMateriales]);

  const sortedChartData = useMemo(() => [...chartData].sort((a, b) => b.value - a.value), [chartData]);

  const handleOpenSelectionDialog = () => {
    setSelectionDialogOpen(true);
  };

  const handleCloseSelectionDialog = () => {
    setSelectionDialogOpen(false);
  };

  const materialesColoredData = materialesChartData.map((item, index) => ({
    ...item,
    fill: COLORS_MATERIALES[index % COLORS_MATERIALES.length],
  }));

  const manoObraCantidades = useMemo(() => {
    const cantidadesMO = {};

    (manoObraData.asignacion.rows || []).forEach(row => {
      const codManoObra = row[0];
      const codigoItem = row[1];
      const cantidadRaw = row[3];
      const unidad = row[4];
      const costo = manoObraCostoIndex >= 0 ? parseNumber(row[manoObraCostoIndex]) : 0;


      if (filteredItemIds.has(codigoItem)) {
        const cantidadNum = parseNumber(cantidadRaw);
        if (!cantidadesMO[codManoObra]) {
          cantidadesMO[codManoObra] = { cantidad: 0, unidad, costo: 0 };
        }
        cantidadesMO[codManoObra].cantidad += cantidadNum;
        cantidadesMO[codManoObra].costo += costo;
      }
    });

    return cantidadesMO;
  }, [manoObraData.asignacion.rows, filteredItemIds, parseNumber, manoObraCostoIndex]);

 const CustomTooltipManoObra = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ padding: 1 }}>
          <Typography variant="body2" fontWeight="bold">{data.name}</Typography>
          <Typography variant="body2">Horas: {formatNumber(data.horas)} {data.unidad}</Typography>
          <Typography variant="body2">Costo: Bs. {formatNumber(data.costo)}</Typography>
        </Paper>
      );
    }
    return null;
  };

  // Modificamos el cálculo de materiales para incluir unidades
  const materialesCantidades = useMemo(() => {
    const cantidades = {};

    (materialesData.asignacion.rows || []).forEach(row => {
      const codMaterial = row[0];
      const codigoItem = row[1];
      const cantidadRaw = row[3];
      const unidad = row[4];

      if (filteredItemIds.has(codigoItem)) {
        const cantidadNum = parseNumber(cantidadRaw);
        if (!cantidades[codMaterial]) {
          cantidades[codMaterial] = { cantidad: 0, unidad };
        }
        cantidades[codMaterial].cantidad += cantidadNum;
      }
    });

    return cantidades;
  }, [materialesData.asignacion.rows, filteredItemIds, parseNumber]);

  const CustomTooltipMateriales = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const cantidades = materialesCantidades[data.codigo] || { cantidad: 0, unidad: '' };
      return (
        <Paper sx={{ padding: 1 }}>
          <Typography variant="body2" fontWeight="bold">{data.name}</Typography>
          <Typography variant="body2">Costo: Bs. {formatNumber(data.value)}</Typography>
          <Typography variant="body2">
            Cantidad total: {formatNumber(cantidades.cantidad)} {cantidades.unidad}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const manoObraHorasChartData = useMemo(() => {
    const nombresManoObra = manoObraData.catalogo?.rows
      ? Object.fromEntries(
          manoObraData.catalogo.rows.map(row => [row[0], row[1]])
        )
      : {};

    return Object.entries(manoObraCantidades).map(([codigo, { cantidad, unidad, costo }]) => ({
      codigo,
      name: nombresManoObra[codigo] || codigo,
      horas: cantidad,
      costo,
      unidad,
    })).sort((a, b) => b.horas - a.horas)
      .slice(0, 10);
  }, [manoObraCantidades, manoObraData.catalogo?.rows]);

  const selectedItemsNames = useMemo(() => {
    if (!selectedItems || selectedItems.length === 0) return [];
    
    const itemNames = {};
    (presupuestoData.rows || []).forEach(row => {
      if (selectedItems.includes(row[0])) {
        itemNames[row[0]] = row[1] || row[0];
      }
    });
    
    return selectedItems.map(itemId => ({
      id: itemId,
      name: itemNames[itemId] || itemId
    }));
  }, [selectedItems, presupuestoData.rows]);

  return (
    <Box sx={{ mt: 4, width: '100%' }}>
      <Typography
        variant="h4"
        sx={{
          color: 'text.primary',
          backgroundColor: 'background.paper',
          padding: 1,
          userSelect: 'none',
          mb: 3,
        }}
        gutterBottom
      >
        {selectedItems?.length ? `Análisis de ${selectedItems.length} Ítems Seleccionados` : "Análisis y Gráficas del Presupuesto"}
      </Typography>
      
      {(selectedItems?.length || selectedMaterial || selectedManoObra) && (
        <Box sx={{ 
          mb: 3,
          p: 2,
          backgroundColor: 'action.hover',
          borderRadius: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center'
        }}>
          <InfoIcon color="info" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 1 }}>
            Filtros aplicados:
          </Typography>
          {selectedItems?.length > 0 && (
            <Chip 
              label={`${selectedItems.length} ítem(s)`} 
              onDelete={() => onSelectItems([])}
              clickable
              onClick={handleOpenSelectionDialog}
              color="primary"
            />
          )}
          {selectedMaterial && (
            <Chip 
              label={`Material: ${nombresMateriales[selectedMaterial] || selectedMaterial}`} 
              onDelete={() => onSelectMaterial(null)}
              clickable
              onClick={() => onSelectMaterial(selectedMaterial)}
            />
          )}
          {selectedManoObra && (
            <Chip 
              label={`Mano de obra: ${selectedManoObra}`}
              onDelete={() => onSelectManoObra(null)}
              clickable
              onClick={() => onSelectManoObra(selectedManoObra)}
            />
          )}
          <Button 
            size="small" 
            onClick={() => {
              onSelectItems([]);
              onSelectMaterial(null);
              onSelectManoObra(null);
            }}
            startIcon={<CloseIcon />}
            sx={{ ml: 'auto' }}
          >
            Limpiar
          </Button>
        </Box>
      )}
      
      {!selectedItems?.length && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenSelectionDialog}
            sx={{ maxWidth: 200 }}
          >
            Seleccionar Ítems
          </Button>
        </Box>
      )}
      
      {selectedItems?.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Ítems Seleccionados
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedItemsNames.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Paper sx={{ 
          p: 2, 
          flex: 1, 
          minWidth: 200, 
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          boxShadow: 3
        }}>
          <Typography variant="h6">Total Presupuesto</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Bs. {formatNumber(totalPresupuesto)}
          </Typography>
          <Typography variant="body2">
            {filteredPresupuestoRows.length} ítems
          </Typography>
        </Paper>
        
        <Paper sx={{ 
          p: 2, 
          flex: 1, 
          minWidth: 200,
          backgroundColor: 'secondary.main',
          color: 'secondary.contrastText',
          boxShadow: 3
        }}>
          <Typography variant="h6">Total Materiales</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Bs. {formatNumber(totalMat)}
          </Typography>
        </Paper>
        
        <Paper sx={{ 
          p: 2, 
          flex: 1, 
          minWidth: 200,
          backgroundColor: 'success.main',
          color: 'success.contrastText',
          boxShadow: 3
        }}>
          <Typography variant="h6">Total Mano de Obra</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Bs. {formatNumber(totalMO)}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Distribución por Tipo
        </Typography>
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie 
              data={sortedChartData} 
              dataKey="value" 
              nameKey="name" 
              outerRadius="90%"
              fill="#8884d8" 
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {sortedChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip 
              formatter={(value, name, props) => [
                `Bs. ${formatNumber(value)}`, 
                props.payload.name
              ]} 
            />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Materiales Principales
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={materialesColoredData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              height={80} 
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <RechartsTooltip content={<CustomTooltipMateriales />} />
            <Legend />
            <Bar dataKey="value" name="Costo Bs.">
              {materialesColoredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        
      </Paper>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Materiales Principales
        </Typography>
        {/* ... (gráfica de materiales se mantiene igual) */}
        
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Unidad</TableCell>
                <TableCell align="right">Costo (Bs.)</TableCell>
                <TableCell align="right">Items</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materialesChartData.map(({ codigo, name, value, cantidad }) => {
                const materialData = materialesCantidades[codigo] || { cantidad: 0, unidad: '' };
                return (
                  <TableRow key={codigo}>
                    <TableCell>{codigo}</TableCell>
                    <TableCell>{name}</TableCell>
                    <TableCell align="right">{formatNumber(materialData.cantidad)}</TableCell>
                    <TableCell align="right">{materialData.unidad}</TableCell>
                    <TableCell align="right">{formatNumber(value)}</TableCell>
                    <TableCell align="right">{cantidad}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

            <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Mano de Obra Principal
        </Typography>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart 
            data={manoObraHorasChartData} 
            layout="vertical"
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={150}
              tick={{ fontSize: 12 }}
            />
            <RechartsTooltip content={<CustomTooltipManoObra />} />
            <Legend />
            <Bar dataKey="horas" name={`Horas (${manoObraHorasChartData[0]?.unidad || ''})`}>
              {manoObraHorasChartData.map((entry, index) => (
                <Cell 
                  key={`cell-horas-${index}`} 
                  fill={COLORS_MANO_OBRA[index % COLORS_MANO_OBRA.length]} 
                />
              ))}
            </Bar>
            
          </BarChart>
        </ResponsiveContainer>

        {/* Tabla con detalles de mano de obra - Ahora con costo */}
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Horas</TableCell>
                <TableCell align="right">Unidad</TableCell>
                <TableCell align="right">Costo (Bs.)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manoObraHorasChartData.map(({ codigo, name, horas, unidad, costo }) => (
                <TableRow key={codigo}>
                  <TableCell>{codigo}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell align="right">{formatNumber(horas)}</TableCell>
                  <TableCell align="right">{unidad}</TableCell>
                  <TableCell align="right">{formatNumber(costo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Tabla de materiales - Ahora con cantidad y unidades */}
      

      <ItemSelectionDialog
        open={selectionDialogOpen}
        onClose={handleCloseSelectionDialog}
        items={presupuestoData.rows || []}
        selectedItems={selectedItems}
        onSelectItems={onSelectItems}
        presupuestoHeaders={presupuestoData.headers || []}
      />

      <Paper sx={{ 
        p: 2, 
        mt: 3,
        boxShadow: 3
      }}>
        <Typography variant="h6" gutterBottom>Resumen por Tipo</Typography>
        <TableContainer >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Costo Total</TableCell>
                <TableCell align="right">% del Total</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Costo Promedio</TableCell>
                <TableCell align="right">Costo por Item</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedChartData.map((row, index) => (
                <TableRow 
                  key={index}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right" className="numeric-cell">
                    Bs. {formatNumber(row.value)}
                  </TableCell>
                  <TableCell align="right" className="numeric-cell">
                    {row.percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell align="right" className="numeric-cell">
                    {row.count}
                  </TableCell>
                  <TableCell align="right" className="numeric-cell">
                    Bs. {formatNumber(row.value / row.count)}
                  </TableCell>
                  <TableCell align="right" className="numeric-cell">
                    <Box sx={{ 
                      width: '100%', 
                      height: 20, 
                      backgroundColor: '#e0e0e0',
                      borderRadius: 1,
                      position: 'relative'
                    }}>
                      <Box sx={{
                        width: `${Math.min(100, (row.value / totalPresupuesto) * 100)}%`,
                        height: '100%',
                        backgroundColor: COLORS[index % COLORS.length],
                        borderRadius: 1
                      }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}