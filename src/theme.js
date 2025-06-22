import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#f50057",
    },
    secondary: {
      main: "#3f51b5",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#222222",
      secondary: "#555555",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#ed6c02",
    },
    success: {
      main: "#2e7d32",
    },
    info: {
      main: "#0288d1",
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#e0e0e0",
        },
        head: {
          fontWeight: "bold",
          backgroundColor: "#f5f5f5",
        },
        body: {
          "&.numeric-cell": {
            textAlign: "right",
            fontFamily: "monospace",
          },
        },
      },
    },
    MuiTableRow: {
  styleOverrides: {
    root: {
      "&.Mui-selected": {
        backgroundColor: "#f50057",
        color: "#ffffff",
        "& .MuiTableCell-root": {
          color: "#ffffff", // Forzar texto blanco en todas las celdas
        },
      },
      "&.Mui-selected:hover": {
        backgroundColor: "#c51162",
      },
    },
  },
},

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
        },
      },
    },
  },
});
