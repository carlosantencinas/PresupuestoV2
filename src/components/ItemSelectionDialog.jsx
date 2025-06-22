import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Chip,
  Box,
  Typography,
  Paper
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { formatNumber, shouldFormatAsNumber } from "../utils/formatUtils";

const Row = memo(({ row, selected, onToggle, headers }) => (
  <TableRow
    hover
    onClick={() => onToggle(row[0])}
    selected={selected}
    sx={{
      "&.MuiTableRow-root.Mui-selected": {
        backgroundColor: "primary.light",
      },
      "&.MuiTableRow-root.Mui-selected:hover": {
        backgroundColor: "primary.light",
      },
    }}
  >
    <TableCell padding="checkbox">
      <Checkbox checked={selected} />
    </TableCell>
    {row.map((cell, j) => (
      <TableCell key={j}>
        {shouldFormatAsNumber(headers[j], cell) 
          ? formatNumber(cell) 
          : cell}
      </TableCell>
    ))}
  </TableRow>
));

const ItemSelectionDialog = ({
  open, 
  onClose, 
  items = [],                // Valor por defecto: array vacío
  selectedItems = [],        // Valor por defecto: array vacío
  onSelectItems,
  presupuestoHeaders = []    // Valor por defecto: array vacío
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      setFilteredItems(
        items.filter(item => 
          item.some(cell => 
            cell?.toString().toLowerCase().includes(term)
          )
        )
      );
    } else {
      setFilteredItems(items);
    }
  }, [searchTerm, items]);

  const handleToggleItem = useCallback((itemId) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectItems(newSelection);
  }, [selectedItems, onSelectItems]);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredItems.length) {
      onSelectItems([]);
    } else {
      onSelectItems(filteredItems.map(item => item[0]));
    }
  }, [filteredItems, selectedItems, onSelectItems]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Seleccionar Ítems</Typography>
          <Chip 
            label={`${selectedItems.length} seleccionados`} 
            color="primary" 
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar ítems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedItems.length > 0 && selectedItems.length < filteredItems.length
                    }
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                {presupuestoHeaders.map((header, i) => (
                  <TableCell key={i} sx={{ fontWeight: 'bold' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((row) => (
                <Row 
                  key={row[0]}
                  row={row}
                  selected={selectedItems.includes(row[0])}
                  onToggle={handleToggleItem}
                  headers={presupuestoHeaders}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button onClick={onClose} color="primary" variant="contained">
          Aplicar Selección
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(ItemSelectionDialog, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.items === nextProps.items &&
    prevProps.selectedItems === nextProps.selectedItems &&
    prevProps.presupuestoHeaders === nextProps.presupuestoHeaders
  );
});