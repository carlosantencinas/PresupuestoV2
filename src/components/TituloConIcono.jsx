import React from "react";
import { Box, Typography } from "@mui/material";

const TituloConIcono = React.memo(function TituloConIcono({ 
  icono, 
  texto, 
  colorFondoIcono = "#1976d2", 
  colorTexto = "#1976d2" 
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
      <Box
        sx={{
          backgroundColor: colorFondoIcono,
          color: "#fff",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 24,
          mr: 2,
          boxShadow: 3,
        }}
      >
        {icono}
      </Box>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: "bold", 
          color: colorTexto,
          whiteSpace: 'pre-line'
        }}
      >
        {texto}
      </Typography>
    </Box>
  );
});

export default TituloConIcono;