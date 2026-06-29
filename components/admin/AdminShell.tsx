"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BuildIcon from "@mui/icons-material/Build";
import FolderIcon from "@mui/icons-material/Folder";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CategoryIcon from "@mui/icons-material/Category";
import ArticleIcon from "@mui/icons-material/Article";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";

const DRAWER_WIDTH = 240;

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
      { label: "Services", href: "/services", icon: <BuildIcon /> },
      {
        label: "Valeurs Studio",
        href: "/studio-values",
        icon: <AutoAwesomeIcon />,
      },
      { label: "Projects", href: "/projects", icon: <FolderIcon /> },
      {
        label: "Galerie de medias",
        href: "/media-assets",
        icon: <PermMediaIcon />,
      },
      {
        label: "Taxonomies",
        href: "/project-taxonomies",
        icon: <CategoryIcon />,
      },
      {
        label: "Trailblaze",
        href: "/trailblaze",
        icon: <ArticleIcon />,
      },
      {
        label: "Testimonials",
        href: "/testimonials",
        icon: <FormatQuoteIcon />,
        disabled: true,
      },
    ],
  },
  {
    title: "Pages",
    items: [
      {
        label: "Accueil",
        href: "/pages/home",
        icon: <ArticleIcon />,
      },
      {
        label: "Studio",
        href: "/pages/studio",
        icon: <ArticleIcon />,
      },
      {
        label: "Services",
        href: "/pages/services",
        icon: <ArticleIcon />,
      },
      {
        label: "Portfolio",
        href: "/pages/portfolio",
        icon: <ArticleIcon />,
      },
      {
        label: "Contact",
        href: "/pages/contact",
        icon: <ArticleIcon />,
      },
    ],
  },
];

const settingsItems: NavItem[] = [
  { label: "Settings", href: "/header", icon: <SettingsIcon fontSize="small" /> },
];

type AdminShellProps = {
  displayName: string;
  email: string;
  children: React.ReactNode;
};

export const AdminShell = ({
  displayName,
  email,
  children,
}: AdminShellProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <Typography variant="h3" sx={{ fontWeight: 600 }}>
          Volante
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {navGroups.map((group, groupIndex) => (
          <Box key={group.title ?? groupIndex} sx={{ mb: group.title ? 1 : 0 }}>
            {group.title && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {group.title}
              </Typography>
            )}
            {group.items.map((item) => (
              <ListItemButton
                key={item.href}
                component={item.disabled ? "div" : Link}
                href={item.disabled ? undefined : item.href}
                selected={isActive(item.href)}
                disabled={item.disabled}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                    "&:hover": { backgroundColor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: "0.875rem" }}
                />
              </ListItemButton>
            ))}
          </Box>
        ))}
      </List>
      <Divider />
      <List sx={{ py: 1 }}>
        {settingsItems.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={isActive(item.href)}
            sx={{
              mx: 1,
              borderRadius: 1,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": {
                  color: "primary.contrastText",
                },
                "&:hover": { backgroundColor: "primary.dark" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: "0.875rem" }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" fontWeight={500} noWrap>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {email}
        </Typography>
        <ListItemButton
          component="a"
          href="/logout"
          sx={{ mx: -1, mt: 1, borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Se deconnecter"
            primaryTypographyProps={{ fontSize: "0.875rem" }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          display: { md: "none" },
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h3">Volante</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          mt: { xs: "64px", md: 0 },
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
};
