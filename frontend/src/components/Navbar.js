import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarItem,
  NavbarBrand,
  Button,
  Link as HeroUILink,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@heroui/react";
import { User } from "@heroui/shared-icons";
import ThemeToggle from "./ThemeToggle";

const MenuIcon = ({ className }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Only show admin login on admin routes, not on public library views
  const isAdminRoute = location.pathname.startsWith("/admin");
  const showAdminLogin = !user && isAdminRoute;

  const handleToggleMenu = () => {
    setIsMenuOpen((open) => !open);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <HeroUINavbar isBordered className="sticky top-0 z-50">
      <NavbarBrand className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          aria-label="Open navigation menu"
          onPress={handleToggleMenu}
          className="sm:hidden"
        >
          <MenuIcon className="w-5 h-5" />
        </Button>
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Karaoke OS
          </h1>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {user && (
          <>
            <NavbarItem>
              <HeroUILink as={Link} to="/admin/songs" color="foreground">
                Manage Songs
              </HeroUILink>
            </NavbarItem>
            <NavbarItem>
              <HeroUILink as={Link} to="/admin/libraries" color="foreground">
                Libraries
              </HeroUILink>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      {/* Desktop actions */}
      <NavbarContent justify="end" className="hidden sm:flex">
        {user ? (
          <>
            <NavbarItem>
              <span className="text-sm text-default-600 mr-2 flex items-center gap-1">
                <User className="w-4 h-4" fill="currentColor" />
                {user.username}
              </span>
            </NavbarItem>
            <NavbarItem>
              <ThemeToggle />
            </NavbarItem>
            <NavbarItem>
              <Button color="danger" variant="flat" onClick={onLogout}>
                Logout
              </Button>
            </NavbarItem>
          </>
        ) : (
          <>
            <NavbarItem>
              <ThemeToggle />
            </NavbarItem>
            {showAdminLogin && (
              <NavbarItem className="hidden lg:flex">
                <HeroUILink as={Link} to="/admin/login" color="foreground">
                  Admin Login
                </HeroUILink>
              </NavbarItem>
            )}
          </>
        )}
      </NavbarContent>

      {/* Mobile drawer menu */}
      <Drawer
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        placement="left"
        size="xs"
        className="sm:hidden"
        hideCloseButton
      >
        <DrawerContent>
          <DrawerHeader className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCloseMenu}
              className="flex items-center gap-2 text-left text-base font-semibold"
            >
              <CloseIcon className="w-5 h-5" />
              <span>Karaoke OS</span>
            </button>
            <ThemeToggle />
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-default-600">
                  <User className="w-4 h-4" fill="currentColor" />
                  {user.username}
                </div>
                <div className="flex flex-col gap-2">
                  <HeroUILink
                    as={Link}
                    to="/admin/songs"
                    color="foreground"
                    onClick={handleCloseMenu}
                  >
                    Manage Songs
                  </HeroUILink>
                  <HeroUILink
                    as={Link}
                    to="/admin/libraries"
                    color="foreground"
                    onClick={handleCloseMenu}
                  >
                    Libraries
                  </HeroUILink>
                </div>
                <Button
                  color="danger"
                  variant="flat"
                  onClick={() => {
                    handleCloseMenu();
                    onLogout();
                  }}
                  className="w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-default-600">
                  <span>Appearance</span>
                </div>
                <div>
                  <ThemeToggle />
                </div>
                {showAdminLogin && (
                  <div className="flex flex-col gap-2">
                    <Button
                      as={Link}
                      to="/admin/login"
                      variant="flat"
                      color="primary"
                      onClick={handleCloseMenu}
                      className="w-full"
                    >
                      Admin Login
                    </Button>
                  </div>
                )}
              </>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </HeroUINavbar>
  );
};

export default Navbar;
