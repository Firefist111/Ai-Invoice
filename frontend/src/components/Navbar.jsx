import React, { useCallback, useRef, useState } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { SignedOut, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const user = useUser();

  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();

  const profileRef = useRef();

  const TOKEN_KEY = "token";

  // for token genertion (fetch token and store in local storage also refresh if not found)

  const fetchAandStoreToken = useCallback(async (options = {}) => {
    try {
      if (!getToken) return null;
      const token = await getToken(options);
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        console.log(token);
      }
      return token;
    } catch (error) {
      console.error("Error fetching and storing token:", error);
      return null;
    }
  }, [getToken]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log(isSignedIn);
      if (isSignedIn) {
        const token = await fetchAandStoreToken();

        if (!token && mounted) {
          await fetchAandStoreToken({ forceRefresh: true });
        }
      }
      else {
        localStorage.removeItem(TOKEN_KEY);
      }
    })();
    //cleanup function
    return () => {
      mounted = false;
    }
  }, [isSignedIn, fetchAandStoreToken]);

  //after successfull login redirect to dashboard
  useEffect(() => {
    if (isSignedIn) {  // ← Add this check!
      const path = window.location.pathname || "/";
      if (path === '/' || path === '/login' || path === '/signUp' || path.startsWith('/auth')) {
        navigate("/app/dashboard");
      }
    }
  }, [isSignedIn, navigate]);

  const openSignIn = () => {
    if (clerk) {
      clerk.openSignIn();
    } else {
      navigate("/login");
    }
  };

  // close profile dropdown on outside click

  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("touchstart", onDocClick);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [profileOpen]);

  const openSignUp = () => {
    if (clerk) {
      clerk.openSignUp();
    } else {
      navigate("/signUp");
    }
  };

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        <div className={navbarStyles.nav}>
          {/* logo */}
          <div className={navbarStyles.logoSection}>
            <Link to="/" className={navbarStyles.logoLink}>
              <img src={logo} alt="" className={navbarStyles.logoImage} />
              <span className={navbarStyles.logoText}>Ai-Invoice</span>
            </Link>
            <div className={navbarStyles.desktopNav}>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className={navbarStyles.navLink}
              >
                Features
              </button>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className={navbarStyles.navLinkInactive}
              >
                Pricing
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 ">
            <div className={navbarStyles.authSection}>
              <SignedOut>
                <button
                  onClick={openSignIn}
                  className={navbarStyles.signInButton}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className={navbarStyles.signUpButton}
                  type="button"
                >
                  <div className={navbarStyles.signUpOverlay}></div>
                  <span className={navbarStyles.signUpText}>Get Started</span>
                </button>
              </SignedOut>
            </div>

            {/* mobile toggle */}
            <button className={navbarStyles.mobileMenuButton}>
              <div
                onClick={() => {
                  setOpen(!open);
                }}
                className={navbarStyles.mobileMenuIcon}
              >
                <span
                  className={`${navbarStyles.mobileMenuLine1}  ${open ? navbarStyles.mobileMenuLine1Open : navbarStyles.mobileMenuLine1Closed}`}
                ></span>

                <span
                  className={`${navbarStyles.mobileMenuLine3}  ${open ? navbarStyles.mobileMenuLine3Open : navbarStyles.mobileMenuLine3Closed}`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${open ? "block" : "hidden"} ${navbarStyles.mobileMenu}`}
      >
        <div className={navbarStyles.mobileMenuContainer}>
          <button
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              setOpen(false);
            }}
            className={navbarStyles.mobileNavLink}
          >
            Features
          </button>
          <button
            onClick={() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              setOpen(false);
            }}
            className={navbarStyles.mobileNavLink}
          >
            Pricing
          </button>
          <div className={navbarStyles.mobileAuthSection}>
            <SignedOut>
              <button
                onClick={openSignIn}
                className={navbarStyles.mobileSignIn}
                type="button"
              >
                Sign In
              </button>
              <button
                onClick={openSignUp}
                className={navbarStyles.mobileSignUp}
                type="button"
              >
                <span className={navbarStyles.signUpText}>Get Started</span>
              </button>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
