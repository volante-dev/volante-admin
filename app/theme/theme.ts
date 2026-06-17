"use client";

import { createTheme } from "@mui/material/styles";
import { colors, typography, borderRadius } from "./tokens";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: colors.green,
      light: colors.greenLight,
      dark: colors.greenDark,
      contrastText: colors.offWhite,
    },
    background: {
      default: colors.offWhite,
      paper: colors.white,
    },
    text: {
      primary: colors.mutedBlack,
      secondary: colors.mutedBlackLight,
    },
    divider: colors.blueGray,
    grey: {
      100: colors.blueGray,
      200: colors.blueGrayDark,
    },
  },

  typography: {
    fontFamily: typography.fontFamily,
    h1: {
      fontFamily: typography.fontFamilyDisplay,
      fontSize: "2rem",
      fontWeight: 400,
      letterSpacing: "0.01em",
      lineHeight: 1.2,
      color: colors.mutedBlack,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 500,
      letterSpacing: "-0.01em",
      lineHeight: 1.3,
      color: colors.mutedBlack,
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 500,
      lineHeight: 1.4,
      color: colors.mutedBlack,
    },
    h4: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.5,
      color: colors.mutedBlack,
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      color: colors.mutedBlack,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      color: colors.mutedBlackLight,
    },
    subtitle2: {
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: colors.mutedBlackLight,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "0.02em",
      textTransform: "none",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      color: colors.mutedBlackLight,
    },
  },

  shape: {
    borderRadius: borderRadius.md,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.sm,
          padding: "8px 20px",
          fontWeight: 500,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        outlined: {
          borderColor: colors.blueGrayDark,
          color: colors.mutedBlack,
          "&:hover": {
            borderColor: colors.green,
            color: colors.green,
            backgroundColor: "transparent",
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.blueGray}`,
          boxShadow: "none",
          borderRadius: borderRadius.lg,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "10px 16px",
          fontSize: "0.875rem",
          borderBottom: `1px solid ${colors.blueGray}`,
        },
        head: {
          fontWeight: 600,
          color: colors.mutedBlackLight,
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: borderRadius.sm,
            "& fieldset": {
              borderColor: colors.blueGrayDark,
            },
            "&:hover fieldset": {
              borderColor: colors.mutedBlackLight,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.green,
              borderWidth: 1,
            },
          },
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.blueGray,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.blueGray}`,
          backgroundColor: colors.white,
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.white,
          color: colors.mutedBlack,
          boxShadow: "none",
          borderBottom: `1px solid ${colors.blueGray}`,
        },
      },
    },

    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.offWhite,
          color: colors.mutedBlack,
        },
        "::selection": {
          backgroundColor: colors.green,
          color: colors.white,
        },
      },
    },
  },
});

export default theme;
