import React, { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TextField,
  Pagination,
  MenuItem,
  FormControl,
  Select,
  Checkbox,
  ListItemText,
  InputLabel,
  Tooltip,
  Chip
} from "@mui/material";
import { formatNumber, shouldFormatAsNumber, splitTextIntoLines } from "../utils/formatUtils";
import { debounce } from 'lodash';

const DataTable = React.memo(function DataTable({
  headers,
  rows,
  defaultRowsPerPage = 5,
  onRowClick,
  selectedRows = [],
  tableTitle,
  showChecklistFilter = false,
  checklistFilterColumns = ["TIPO", "Und."],
  globalFilter = "",
  multiSelect = false,
  onMultiSelect,
  columnWidths = {},
}) {
  const [filters, setFilters] = useState({});
  const [selectedItems, setSelectedItems] = useState(() => {
    const obj = {};
    checklistFilterColumns.forEach(col => {
      obj[col] = [];
    });
    return obj;
  });
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const isLongTextColumn = (header) => {
    const headerStr = header?.toString().toLowerCase() || '';
    return (
      headerStr.includes('nombre') ||
      headerStr.includes('descripción') ||
      headerStr.includes('material') ||
      headerStr.includes('mano de obra') ||
      headerStr.includes('item') ||
      headerStr.includes('concepto') ||
      headerStr.includes('descripcion') ||
      headerStr.includes('detalle')
    );
  };

  const checklistColsInfo = checklistFilterColumns.map(col => {
    const colIndex = headers.findIndex(h => h === col);
    if (colIndex < 0) return { col, colIndex, uniqueValues: [], normalizedMap: {} };
    const uniqueRawValues = [...new Set(rows.map(row => row[colIndex]?.toString()).filter(Boolean))];
    const normalizedMap = {};
    uniqueRawValues.forEach(v => {
      const norm = v.toLowerCase();
      if (!(norm in normalizedMap)) normalizedMap[norm] = v;
    });
    return { col, colIndex, uniqueValues: Object.keys(normalizedMap), normalizedMap };
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (globalFilter) {
        const gfLower = globalFilter.toLowerCase();
        const matchesGlobal = row.some(cell => 
          cell?.toString().toLowerCase().includes(gfLower)
        );
        if (!matchesGlobal) return false;
      }
      for (const { col, colIndex } of checklistColsInfo) {
        if (selectedItems[col]?.length > 0) {
          const cellVal = row[colIndex]?.toString().toLowerCase() || "";
          if (!selectedItems[col].includes(cellVal)) return false;
        }
      }
      return headers.every((_, idx) => {
        if (checklistFilterColumns.includes(headers[idx])) return true;
        if (!filters[idx]) return true;
        const cellValue = row[idx]?.toString().toLowerCase() || "";
        return cellValue.includes(filters[idx].toLowerCase());
      });
    });
  }, [rows, globalFilter, filters, selectedItems, checklistColsInfo, headers, checklistFilterColumns]);

  const sortedRows = useMemo(() => {
    const rowsToSort = [...filteredRows];
    if (sortColumn !== null) {
      rowsToSort.sort((a, b) => {
        const aValue = a[sortColumn] || "";
        const bValue = b[sortColumn] || "";
        if (!isNaN(aValue) && !isNaN(bValue)) {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        return sortDirection === "asc"
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      });
    }
    return rowsToSort;
  }, [filteredRows, sortColumn, sortDirection]);

  const paginatedRows = useMemo(() => {
    return sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  const debouncedFilterChange = useMemo(() => debounce((idx, value) => {
    setFilters(prev => ({ ...prev, [idx]: value }));
    setPage(1);
  }, 300), []);

  const handleFilterChange = useCallback((idx, value) => {
    debouncedFilterChange(idx, value);
  }, [debouncedFilterChange]);

  const handleChecklistChange = (col) => (event) => {
    const { value } = event.target;
    const normalized = (typeof value === 'string' ? value.split(',') : value).map(v => v.toLowerCase());
    setSelectedItems(prev => ({ ...prev, [col]: normalized }));
    setPage(1);
  };

  const handleSort = useCallback((idx) => {
    if (sortColumn === idx) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(idx);
      setSortDirection("asc");
    }
  }, [sortColumn]);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(1);
  };

  const handleRowSelection = useCallback((rowId) => {
    requestAnimationFrame(() => {
      if (!multiSelect) return onRowClick?.(rowId);
      if (onMultiSelect) {
        const updated = selectedRows.includes(rowId)
          ? selectedRows.filter(id => id !== rowId)
          : [...selectedRows, rowId];
        onMultiSelect(updated);
      }
    });
  }, [multiSelect, onMultiSelect, onRowClick, selectedRows]);

  return (
    <Box sx={{ mb: 4 }}>
      {tableTitle && (
        <Typography variant="h5" sx={{ mb: 2, color: "primary.main" }}>
          {tableTitle}
          <Chip label={`${filteredRows.length} registros`} size="small" sx={{ ml: 2 }} />
          {multiSelect && selectedRows.length > 0 && (
            <Chip label={`${selectedRows.length} seleccionados`} size="small" sx={{ ml: 1 }} color="primary" />
          )}
        </Typography>
      )}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {multiSelect && <TableCell padding="checkbox" sx={{ width: 40 }}><Checkbox /></TableCell>}
              {headers.map((h, i) => {
                const normalizeHeader = (header) => header.toLowerCase().replace(/\s+/g, ' ').trim();
                const width = columnWidths[h] ?? columnWidths[normalizeHeader(h)] ?? 100;

                return (
                  <TableCell
                    key={i}
                    onClick={() => handleSort(i)}
                    sx={{
                      fontWeight: "bold",
                      color: "primary.main",
                      fontSize: 14,
                      cursor: "pointer",
                      userSelect: "none",
                      minWidth: width,
                      maxWidth: width,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      textAlign: "center"
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                      {h}
                      {sortColumn === i && (
                        <Typography variant="caption">{sortDirection === "asc" ? "↑" : "↓"}</Typography>
                      )}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              {multiSelect && <TableCell padding="checkbox" />}
              {headers.map((h, i) => {
                const width = columnWidths[h] ?? 100;
                return (
                  <TableCell key={i} sx={{ minWidth: width, maxWidth: width, p: 1 }}>
                    {showChecklistFilter && checklistFilterColumns.includes(h) ? (() => {
                      const colInfo = checklistColsInfo.find(c => c.col === h);
                      const selected = selectedItems[h] || [];
                      return (
                        <FormControl fullWidth size="small">
                          <InputLabel>Filtrar {h}</InputLabel>
                          <Select
                            multiple
                            value={selected}
                            onChange={handleChecklistChange(h)}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.slice(0, 2).map((val) => (
                                  <Chip key={val} label={colInfo.normalizedMap[val] || val} size="small" />
                                ))}
                                {selected.length > 2 && <Chip label={`+${selected.length - 2}`} size="small" />}
                              </Box>
                            )}
                          >
                            {colInfo.uniqueValues.map((val) => (
                              <MenuItem key={val} value={val}>
                                <Checkbox checked={selected.includes(val)} size="small" />
                                <ListItemText primary={colInfo.normalizedMap[val]} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    })() : (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder={`Filtrar ${h}`}
                        value={filters[i] || ""}
                        onChange={(e) => handleFilterChange(i, e.target.value)}
                        fullWidth
                        InputProps={{ sx: { height: 40 } }}
                      />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + (multiSelect ? 1 : 0)} align="center">
                  <Typography variant="body1" color="text.secondary">No se encontraron resultados</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, i) => (
                <TableRow
                  key={i}
                  onClick={() => handleRowSelection(row[0])}
                  selected={selectedRows.includes(row[0])}
                  hover
                  
                >
                  {multiSelect && (
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedRows.includes(row[0])} />
                    </TableCell>
                  )}
                  {row.map((cell, j) => {
                    const header = headers[j];
                    const width = columnWidths[header] ?? 200;
                    const isLongText = isLongTextColumn(header);
                    const isNumeric = shouldFormatAsNumber(header, cell);
                    const formatted = isNumeric ? formatNumber(cell) : cell;
                    const display = isLongText ? splitTextIntoLines(formatted) : formatted;
                    return (
                      <TableCell 
                        key={j}
                        sx={{ 
                          minWidth: width, 
                          maxWidth: width, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          textAlign: isNumeric ? 'right' : 'left',
                          fontFamily: isNumeric ? 'monospace' : 'inherit'
                        }}
                      >
                        <Tooltip title={cell?.toString() || ''} placement="top">
                          <span style={{ whiteSpace: 'pre-line' }}>{display}</span>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            {[5, 10, 25, 50, 100].map(n => (
              <MenuItem key={n} value={n}>{n} filas</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Pagination
          count={Math.ceil(filteredRows.length / rowsPerPage)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          size="small"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
}, (prev, next) => {
  return (
    prev.headers === next.headers &&
    prev.rows === next.rows &&
    prev.selectedRows === next.selectedRows &&
    prev.globalFilter === next.globalFilter &&
    prev.multiSelect === next.multiSelect &&
    prev.showChecklistFilter === next.showChecklistFilter &&
    JSON.stringify(prev.checklistFilterColumns) === JSON.stringify(next.checklistFilterColumns)
  );
});

export default DataTable;
