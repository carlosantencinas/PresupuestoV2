import React, { useCallback, useState } from "react";
import DataTable from "../components/DataTable";

export default function MaterialesTab({ 
  materialesData,
  presupuestoData,
  globalFilter,
  onSelectMaterial
}) {
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const handleMaterialClick = useCallback((material) => {
    setSelectedMaterial(selectedMaterial === material ? null : material);
    onSelectMaterial && onSelectMaterial(material);
  }, [selectedMaterial, onSelectMaterial]);

  const getItemsByMaterial = useCallback((material) => {
    if (!material) return [];
    
    const itemCodes = new Set(
      materialesData.asignacion.rows
        .filter(row => row[0] === material)
        .map(row => row[1])
    );
    
    return presupuestoData.rows.filter(row => itemCodes.has(row[0]));
  }, [materialesData.asignacion.rows, presupuestoData.rows]);

  return (
    <>
      <DataTable
        headers={materialesData.catalogo.headers}
        rows={materialesData.catalogo.rows}
        defaultRowsPerPage={10}
        onRowClick={handleMaterialClick}
        selectedRows={selectedMaterial ? [selectedMaterial] : []}
        tableTitle="Catálogo de Materiales"
        globalFilter={globalFilter}
        columnWidths={{ "Und.": 40, "Materiales": 200 ,"Codigo": 60,"Codigo Item": 50,"TIPO": 60, "Cantidad": 70 , "Unitario [Bs]": 70 , "Costo [Bs]": 70   }}  // <-- Aquí defines anchos a tu gusto
      />
      
      {selectedMaterial && (
        <DataTable
          headers={presupuestoData.headers}
          rows={getItemsByMaterial(selectedMaterial)}
          tableTitle={`Ítems que usan el material: ${selectedMaterial}`}
          defaultRowsPerPage={10}
          globalFilter={globalFilter}
                  columnWidths={{ "Und.": 40, "Materiales": 200 ,"Codigo": 60,"Codigo Item": 50,"TIPO": 80, "Cantidad": 50 , "Unitario [Bs]": 70 , "Costo [Bs]": 70 ,"Nº": 20   }}  // <-- Aquí defines anchos a tu gusto

        />
      )}
    </>
  );
}