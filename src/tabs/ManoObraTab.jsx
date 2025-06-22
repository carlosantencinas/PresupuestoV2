import React, { useCallback, useState } from "react";
import DataTable from "../components/DataTable";

export default function ManoObraTab({ 
  manoObraData,
  presupuestoData,
  globalFilter,
  onSelectManoObra
}) {
  const [selectedManoObra, setSelectedManoObra] = useState(null);

  const handleManoObraClick = useCallback((manoObra) => {
    setSelectedManoObra(selectedManoObra === manoObra ? null : manoObra);
    onSelectManoObra && onSelectManoObra(manoObra);
  }, [selectedManoObra, onSelectManoObra]);

  const getItemsByManoObra = useCallback((manoObra) => {
    if (!manoObra) return [];
    
    const itemCodes = new Set(
      manoObraData.asignacion.rows
        .filter(row => row[0] === manoObra)
        .map(row => row[1])
    );
    
    return presupuestoData.rows.filter(row => itemCodes.has(row[0]));
  }, [manoObraData.asignacion.rows, presupuestoData.rows]);

  return (
    <>
      <DataTable
        headers={manoObraData.catalogo.headers}
        rows={manoObraData.catalogo.rows}
        defaultRowsPerPage={10}
        onRowClick={handleManoObraClick}
        selectedRows={selectedManoObra ? [selectedManoObra] : []}
        tableTitle="Catálogo de Mano de Obra"
        globalFilter={globalFilter}
                columnWidths={{ "Und.": 40, "Materiales": 200 ,"Codigo": 60,"Codigo Item": 50,"TIPO": 60, "Cantidad": 70 , "Unitario [Bs]": 70 , "Costo [Bs]": 70   }}  // <-- Aquí defines anchos a tu gusto

      />
      
      {selectedManoObra && (
        <DataTable
          headers={presupuestoData.headers}
          rows={getItemsByManoObra(selectedManoObra)}
          tableTitle={`Ítems que requieren: ${selectedManoObra}`}
          defaultRowsPerPage={10}
          globalFilter={globalFilter}
                  columnWidths={{ "Und.": 40, "Materiales": 200 ,"Codigo": 60,"Codigo Item": 50,"TIPO": 80, "Cantidad": 70 , "Unitario [Bs]": 70 , "Costo [Bs]": 70 ,"Nº": 20   }}  // <-- Aquí defines anchos a tu gusto

        />
      )}
    </>
  );
}