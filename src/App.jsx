import React, { useState, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, Button, Tabs, Tab, Paper, Typography } from "@mui/material";
import { Upload as UploadIcon, PictureAsPdf as PdfIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { lightTheme } from "./theme";
import LoadingOverlay from "./components/LoadingOverlay";
import TituloConIcono from "./components/TituloConIcono";
import GlobalSearch from "./components/GlobalSearch";
import PresupuestoTab from "./tabs/PresupuestoTab";
import MaterialesTab from "./tabs/MaterialesTab";
import ManoObraTab from "./tabs/ManoObraTab";
import CalculationsSheet from "./tabs/CalculationsSheet";
import { useMediaQuery } from "@mui/material";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function App() {
  const [sheets, setSheets] = useState({});
  const [projectTitle, setProjectTitle] = useState("Adjunta el archivo de Presupuesto");
  const [activeTab, setActiveTab] = useState("presupuesto");
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedManoObra, setSelectedManoObra] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const appData = useMemo(() => {
    return {
      presupuesto: {
        headers: sheets["Presupuesto_General"]?.[0] || [],
        rows: sheets["Presupuesto_General"]?.slice(1) || []
      },
      materiales: {
        catalogo: {
          headers: sheets["Catálogo_Materiales"]?.[0] || [],
          rows: sheets["Catálogo_Materiales"]?.slice(1) || []
        },
        asignacion: {
          headers: sheets["Asignación_Materiales"]?.[0] || [],
          rows: sheets["Asignación_Materiales"]?.slice(1) || []
        }
      },
      manoObra: {
        catalogo: {
          headers: sheets["Catálogo_ManoObra"]?.[0] || [],
          rows: sheets["Catálogo_ManoObra"]?.slice(1) || []
        },
        asignacion: {
          headers: sheets["Asignación_ManoObra"]?.[0] || [],
          rows: sheets["Asignación_ManoObra"]?.slice(1) || []
        }
      }
    };
  }, [sheets]);

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setSelectedItem(null);
    setSelectedItems([]);
    setSelectedMaterial(null);
    setSelectedManoObra(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const parsed = {};

        const requiredSheets = ["Presupuesto_General", "Catálogo_Materiales", "Asignación_Materiales"];
        const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));

        if (missingSheets.length > 0) {
          throw new Error(`Faltan hojas requeridas: ${missingSheets.join(", ")}`);
        }

        workbook.SheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          parsed[name] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        });

        const hoja1 = workbook.Sheets["Hoja1"];
        if (hoja1 && hoja1["B1"]) {
          const titleText = hoja1["B1"].v.toString();
          setProjectTitle(titleText);
        } else {
          setProjectTitle("Presupuesto General del Proyecto");
        }

        setSheets(parsed);
      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        alert(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      alert("Error al leer el archivo. Por favor, inténtalo de nuevo.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const exportPDF = async () => {
  const element = document.getElementById("reporte");
  if (!element) return;

  setLoading(true);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
    });

    const margin = 40; // Margen en puntos
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pdfWidth - margin * 2;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const scaleRatio = usableWidth / imgWidth;
    const scaledHeight = imgHeight * scaleRatio;

    let heightLeft = scaledHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", margin, position + margin, usableWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      position = -(scaledHeight - heightLeft);
      pdf.addImage(imgData, "JPEG", margin, position + margin, usableWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${projectTitle.replace(/\n/g, " ")}.pdf`);
  } catch (error) {
    console.error("Error generando PDF:", error);
    alert("Hubo un problema al generar el PDF. Intenta nuevamente.");
  } finally {
    setLoading(false);
  }
};


  const resetFilters = () => {
    setSelectedItem(null);
    setSelectedItems([]);
    setSelectedMaterial(null);
    setSelectedManoObra(null);
    setGlobalFilter("");
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSelectedItems([]);
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Box sx={{ padding: isMobile ? 2 : 4, fontFamily: "Arial", bgcolor: "background.default", minHeight: "100vh" }}>
        <LoadingOverlay loading={loading} />

        <Box sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <TituloConIcono
            icono="📋"
            texto={projectTitle}
            colorFondoIcono="#ffd217"
            colorTexto="#60091a"
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <input
              type="file"
              accept=".xlsx, .xls"
              id="input-excel"
              onChange={handleImportExcel}
              style={{ display: "none" }}
            />
            <label htmlFor="input-excel">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                sx={{ minWidth: isMobile ? '100%' : 180 }}
                fullWidth={isMobile}
              >
                Subir Excel
              </Button>
            </label>

            <Button
              variant="outlined"
              onClick={exportPDF}
              startIcon={<PdfIcon />}
              disabled={!appData.presupuesto.headers.length || loading}
              sx={{ minWidth: isMobile ? '100%' : 180 }}
              fullWidth={isMobile}
            >
              Exportar PDF
            </Button>

            <Button
              variant="outlined"
              onClick={resetFilters}
              startIcon={<RefreshIcon />}
              disabled={!appData.presupuesto.headers.length}
              sx={{ minWidth: isMobile ? '100%' : 180 }}
              fullWidth={isMobile}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </Box>

        {appData.presupuesto.headers.length > 0 && (
          <>
            <GlobalSearch onSearch={setGlobalFilter} />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label={isMobile ? "Presup." : "Presupuesto"} value="presupuesto" icon={isMobile ? <span>📝</span> : null} iconPosition="start" />
                <Tab label={isMobile ? "Mat." : "Materiales"} value="materiales" icon={isMobile ? <span>🏗️</span> : null} iconPosition="start" />
                <Tab label={isMobile ? "M. Obra" : "Mano de Obra"} value="manoObra" icon={isMobile ? <span>👷</span> : null} iconPosition="start" />
                <Tab label="Análisis" value="calculos" icon={isMobile ? <span>📊</span> : null} iconPosition="start" />
              </Tabs>
            </Box>
          </>
        )}

        <Box id="reporte">
          {appData.presupuesto.headers.length > 0 ? (
            <>
              {activeTab === "presupuesto" ? (
                <PresupuestoTab
                  presupuestoData={appData.presupuesto}
                  materialesData={appData.materiales}
                  manoObraData={appData.manoObra}
                  globalFilter={globalFilter}
                  selectedItem={selectedItem}
                  onSelectItem={handleSelectItem}
                  onSelectMaterial={setSelectedMaterial}
                  onSelectManoObra={setSelectedManoObra}
                />
              ) : activeTab === "materiales" ? (
                <MaterialesTab
                  materialesData={appData.materiales}
                  presupuestoData={appData.presupuesto}
                  globalFilter={globalFilter}
                  onSelectMaterial={setSelectedMaterial}
                />
              ) : activeTab === "manoObra" ? (
                <ManoObraTab
                  manoObraData={appData.manoObra}
                  presupuestoData={appData.presupuesto}
                  globalFilter={globalFilter}
                  onSelectManoObra={setSelectedManoObra}
                />
              ) : (
                <CalculationsSheet
                  presupuestoData={appData.presupuesto}
                  materialesData={appData.materiales}
                  manoObraData={appData.manoObra}
                  selectedItems={selectedItems}
                  selectedMaterial={selectedMaterial}
                  selectedManoObra={selectedManoObra}
                  onSelectItems={setSelectedItems}
                  onSelectMaterial={setSelectedMaterial}
                  onSelectManoObra={setSelectedManoObra}
                />
              )}
            </>
          ) : (
            <Paper sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: 'background.paper',
              boxShadow: 3
            }}>
              <Typography variant="h5" gutterBottom>
                Bienvenido al Analizador de Presupuestos
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Por favor, sube un archivo Excel con la estructura requerida para comenzar.
              </Typography>
              <label htmlFor="input-excel">
                <Button
                  variant="contained"
                  component="span"
                  size="large"
                  startIcon={<UploadIcon />}
                >
                  Seleccionar Archivo Excel
                </Button>
              </label>
              <Typography variant="caption" display="block" sx={{ mt: 3 }}>
                El archivo debe contener al menos las hojas: Presupuesto_General, Catálogo_Materiales y Asignación_Materiales
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
