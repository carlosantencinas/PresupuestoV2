import React from "react";
import DataTable from "../components/DataTable";



export default function PresupuestoTab({ 
  presupuestoData,
  materialesData,
  manoObraData,
  globalFilter,
  selectedItem,
  onSelectItem,
  onSelectMaterial,
  onSelectManoObra
}) {
  return (
    <>
<DataTable
  headers={presupuestoData.headers}
  rows={presupuestoData.rows}
  defaultRowsPerPage={10}
  onRowClick={onSelectItem}
  selectedRows={selectedItem ? [selectedItem] : []}
  tableTitle="Presupuesto General"
  showChecklistFilter={true}
  checklistFilterColumns={["Und.", "TIPO"]}
  globalFilter={globalFilter}
  columnWidths={{ "Und.": 40, "Cantidad": 60 ,"Codigo Item": 60,"Descripción Item": 250,"TIPO": 200,"Unitario [Bs]": 70,"Costo [Bs]": 70,"Nº": 20  }}  // <-- Aquí defines anchos a tu gusto

/>

      
      {selectedItem && (
        <>
          <DataTable
            headers={materialesData.asignacion.headers}
            rows={materialesData.asignacion.rows.filter(row => row[1] === selectedItem)}
            tableTitle={`Materiales asignados al ítem: ${selectedItem}`}
            globalFilter={globalFilter}
            onRowClick={onSelectMaterial}
            columnWidths={{ "Und.": 30, "Cantidad Usada": 60 ,"Cod Material": 70,"Codigo Item": 70,"TIPO": 60,"Rendimiento (c/Unid ítem)" :100,"P. Unitario [Bs]": 70 , "Costo [Bs]":50 }}  // <-- Aquí defines anchos a tu gusto
          />
          
          <DataTable
            headers={manoObraData.asignacion.headers}
            rows={manoObraData.asignacion.rows.filter(row => row[1] === selectedItem)}
            tableTitle={`Mano de obra asignada al ítem: ${selectedItem}`}
            globalFilter={globalFilter}
            onRowClick={onSelectManoObra}
            columnWidths={{ "Und.": 40, "Cantidad Usada MO": 60 ,"Cod ManoObra": 70,"Codigo Item": 70,"Mano de obra": 60,"Rendimiento (c/Unid ítem)" :70,"P. Unitario [Bs]": 70 , "Costo [Bs]":50  }}  // <-- Aquí defines anchos a tu gusto
          />
        </>
      )}
    </>
  );
}

