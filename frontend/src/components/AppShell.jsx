import React, { useEffect } from "react";
import { appShellStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";
import { Link, Links, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useTheme } from "../context/ThemeContext";

const AppShell = () => {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { dark, toggleTheme } = useTheme();
  const [spinKey, setSpinKey] = React.useState(0);

  const handleThemeToggle = () => {
    setSpinKey((k) => k + 1);
    toggleTheme();
  };

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch (error) {
      return false;
    }
  });

  const [scrolled, setScrolled] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setCollapsed(false);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", collapsed ? "true" : "false");
    } catch { }
  }, [collapsed]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const displayName = (() => {
    if (!user) return "User";
    const name = user.fullName || user.firstName || user.username || "";
    return name.trim() || (user.email || "").split?.("@")?.[0] || "User";
  })();

  const firstName = () => {
    const parts = displayName.split(" ").filter(Boolean);
    return parts.length ? parts[0] : displayName;
  };

  const initials = () => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const DashboardIcon = ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );

  const InvoiceIcon = ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const CreateIcon = ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );

  const ProfileIcon = ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const LogoutIcon = ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  const CollapseIcon = ({ className = "w-4 h-4", collapsed }) => (
    <svg
      className={`${className} transition-transform duration-300 ${collapsed ? "rotate-180" : ""
        }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
      />
    </svg>
  );

  const SidebarLink = ({ to, icon, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `
        ${appShellStyles.sidebarLink}
        ${collapsed ? appShellStyles.sidebarLinkCollapsed : ""}
        ${isActive
          ? appShellStyles.sidebarLinkActive
          : appShellStyles.sidebarLinkInactive
        }
      `}
      onClick={() => setMobileOpen(false)}
    >
      {({ isActive }) => (
        <>
          <div
            className={`${appShellStyles.sidebarIcon} ${isActive
              ? appShellStyles.sidebarIconActive
              : appShellStyles.sidebarIconInactive
              }`}
          >
            {icon}
          </div>
          {!collapsed && (
            <span className={appShellStyles.sidebarText}>{children}</span>
          )}
          {!collapsed && isActive && (
            <div className={appShellStyles.sidebarActiveIndicator} />
          )}
        </>
      )}
    </NavLink>
  );
  ///logout function
  const logout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.warn("Error during sign out:", error);
    }
  };

  return (
    <div className={`${appShellStyles.root} dark:bg-gray-950`}>
      <div className={appShellStyles.layout}>
        <aside
          className={`${appShellStyles.sidebar} ${collapsed ? appShellStyles.collapsed : appShellStyles.sidebarExpanded} dark:bg-gray-900 dark:border-gray-700/60`}
        >
          <div className={appShellStyles.sidebarGradient}> </div>
          <div className={appShellStyles.sidebarContainer}>
            <div>
              {/* logo */}
              <div
                className={`${appShellStyles.sidebarLogo} ${collapsed ? appShellStyles.logoContainerCollapsed : ""}`}
              >
                <Link to="/" className={appShellStyles.logoLink}>
                  <div className="relative">
                    <img
                      src={logo}
                      alt="Logo"
                      className={appShellStyles.logoImage}
                    />
                    <div className="absolute inset-0 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  </div>

                  {!collapsed && (
                    <div className={appShellStyles.logoTextContainer}>
                      <span className={appShellStyles.logoText}>
                        AI-Invoice
                      </span>
                      <div className={appShellStyles.logoUnderline}></div>
                    </div>
                  )}
                </Link>
              </div>

              {/* Navigation */}
              <nav className={appShellStyles.nav}>
                <SidebarLink to="/app/dashboard" icon={<DashboardIcon />}>
                  Dashboard
                </SidebarLink>
                <SidebarLink to="/app/invoices" icon={<InvoiceIcon />}>
                  Invoices
                </SidebarLink>
                <SidebarLink to="/app/create-invoice" icon={<CreateIcon />}>
                  Create Invoice
                </SidebarLink>
                <SidebarLink to="/app/business" icon={<ProfileIcon />}>
                  Business Profile
                </SidebarLink>
              </nav>
            </div>

            <div className={appShellStyles.userSection}>
              <div
                className={`${appShellStyles.userDivider} ${collapsed ? appShellStyles.userDividerCollapsed : appShellStyles.userDividerExpanded}`}
              >
                {!collapsed ? (
                  <button
                    onClick={logout}
                    className={appShellStyles.logoutButton}
                  >
                    <LogoutIcon className={appShellStyles.logoutIcon} />
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={logout}
                    className="w-full flex justify-center p-3"
                  >
                    <LogoutIcon className="h-5" />
                  </button>
                )}

                <div className={appShellStyles.collapseSection}>
                  <button
                    onClick={toggleSidebar}
                    className={`${appShellStyles.collapseButton} ${collapsed ? appShellStyles.collapseButtonCollapsed : ""}`}
                  >
                    <CollapseIcon collapsed={collapsed} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>


        {/* mobileView */}

        {mobileOpen && (
          <div className={appShellStyles.mobileOverlay}>
            <div
              className={appShellStyles.mobileBackdrop}
              onClick={() => setMobileOpen(false)}
            >
              <div className={appShellStyles.mobileSidebar}>
                <div className={appShellStyles.mobileHeader}>
                  <Link to="/" className={appShellStyles.mobileLogoLink}>
                    <img src={logo} alt="Logo" />
                    <span className={appShellStyles.mobileLogoText}>
                      AI-Invoice
                    </span>
                  </Link>

                  <button
                    className={appShellStyles.mobileCloseButton}
                    onClick={() => setMobileOpen(false)}
                  >
                    <svg
                      className={appShellStyles.mobileCloseIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Navigation */}
                <nav className={appShellStyles.mobileNav}>
                  <NavLink
                    onClick={() => setMobileOpen(false)}
                    to="/app/dashboard"
                    className={({ isActive }) =>
                      `${appShellStyles.mobileNavLink} ${isActive
                        ? appShellStyles.mobileNavLinkActive
                        : appShellStyles.mobileNavLinkInactive
                      }`
                    }
                  >
                    {" "}
                    <DashboardIcon /> Dashboard
                  </NavLink>
                  <NavLink
                    onClick={() => setMobileOpen(false)}
                    to="/app/invoices"
                    className={({ isActive }) =>
                      `${appShellStyles.mobileNavLink} ${isActive
                        ? appShellStyles.mobileNavLinkActive
                        : appShellStyles.mobileNavLinkInactive
                      }`
                    }
                  >
                    {" "}
                    <InvoiceIcon /> Invoices
                  </NavLink>
                  <NavLink
                    onClick={() => setMobileOpen(false)}
                    to="/app/create-invoice"
                    className={({ isActive }) =>
                      `${appShellStyles.mobileNavLink} ${isActive
                        ? appShellStyles.mobileNavLinkActive
                        : appShellStyles.mobileNavLinkInactive
                      }`
                    }
                  >
                    {" "}
                    <CreateIcon /> Create Invoice
                  </NavLink>
                  <NavLink
                    onClick={() => setMobileOpen(false)}
                    to="/app/business"
                    className={({ isActive }) =>
                      `${appShellStyles.mobileNavLink} ${isActive
                        ? appShellStyles.mobileNavLinkActive
                        : appShellStyles.mobileNavLinkInactive
                      }`
                    }
                  >
                    {" "}
                    <ProfileIcon /> Business Profile
                  </NavLink>
                </nav>
                <div className={appShellStyles.mobileLogoutSection}>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className={appShellStyles.mobileLogoutButton}
                  >
                    <LogoutIcon />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAin Content */}

        <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950">
          <header
            className={`${appShellStyles.header} dark:bg-gray-900/95 dark:border-gray-700/60 ${scrolled
              ? appShellStyles.headerScrolled
              : appShellStyles.headerNotScrolled
              }`}
          >
            <div className={appShellStyles.headerTopSection}>
              <div className={appShellStyles.headerContent}>
                <button
                  onClick={() => setMobileOpen(true)}
                  className={appShellStyles.mobileMenuButton}
                >
                  <svg
                    className={appShellStyles.mobileMenuIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>


                <div className={appShellStyles.welcomeContainer}>
                  <h2 className={appShellStyles.welcomeTitle}>
                    Welcome Back,{" "}
                    <span className={appShellStyles.welcomeName}>
                      {firstName()}
                    </span>
                  </h2>
                  <p className={appShellStyles.welcomeSubtitle}>
                    Ready to create invoices?
                  </p>
                </div>
              </div>
            </div>

            <div className={appShellStyles.headerActions}>
              {/* Dark mode toggle */}
              <button
                key={spinKey}
                onClick={handleThemeToggle}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md animate-spin-once"
                title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {dark ? (
                  <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 15a5 5 0 100-10 5 5 0 000 10zm7.071-12.071a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM21 11h1a1 1 0 110 2h-1a1 1 0 110-2zM4.929 17.071a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zm12.728 1.414a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM4 11H3a1 1 0 100 2h1a1 1 0 100-2zm1.636-6.364a1 1 0 011.414 0l.707.707A1 1 0 116.343 6.757l-.707-.707a1 1 0 010-1.414zM12 20a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => navigate("/app/create-invoice")}
                className={appShellStyles.ctaButton}
              >
                <CreateIcon className={appShellStyles.ctaIcon} />
                <span className="hidden xs:inline">Create Invoice</span>
              </button>

              <div className={appShellStyles.userSectionDesktop}>
                <div className={appShellStyles.userInfo}>
                  <div className={`${appShellStyles.userName} dark:text-gray-100`}>{displayName}</div>
                  <div className={`${appShellStyles.email} dark:text-gray-400`}>{user?.email}</div>
                </div>

                <div className={appShellStyles.userAvatarContainer}>
                  <div className={appShellStyles.userAvatar}>{initials()}</div>
                </div>
              </div>
            </div>
          </header>

          <main className={`${appShellStyles.main} dark:bg-gray-950`}>
            <div className={appShellStyles.mainContainer}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
