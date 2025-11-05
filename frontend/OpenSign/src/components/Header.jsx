import { useState, useEffect } from "react";
import dp from "../assets/images/dp.png";
import FullScreenButton from "./FullScreenButton";
import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router";
import Parse from "parse";
import { useWindowSize } from "../hook/useWindowSize";
import {
  openInNewTab,
  saveLanguageInLocal
} from "../constant/Utils";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "../redux/reducers/sidebarReducer.js";
import { checkSubscriptionStatus } from "../utils/subscriptionUtils";

const Header = ({ isConsole, setIsLoggingOut }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const dispatch = useDispatch();
  const username = localStorage.getItem("username") || "";
  const image = localStorage.getItem("profileImg") || dp;
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [testMode, setTestMode] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    closeSidebar();
  };
  const closeSidebar = () => {
    if (width && width <= 768) {
      dispatch(toggleSidebar(false));
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    // Check if we're in test mode
    setTestMode(localStorage.getItem("subscriptionTestMode") !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const status = await checkSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.log("Error fetching subscription status:", error);
    }
  };

  useEffect(() => {
    closeSidebar();
  }, [width]);

  const showSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleLogout = async () => {
    setIsOpen(false);
    setIsLoggingOut(true);
    try {
      await Parse.User.logOut();
    } catch (err) {
      console.log("Err while logging out", err);
    }
    let appdata = localStorage.getItem("userSettings");
    let applogo = localStorage.getItem("appLogo");
    let defaultmenuid = localStorage.getItem("defaultmenuid");
    let PageLanding = localStorage.getItem("PageLanding");
    let baseUrl = localStorage.getItem("baseUrl");
    let appid = localStorage.getItem("parseAppId");
    let favicon = localStorage.getItem("favicon");

    localStorage.clear();
    saveLanguageInLocal(i18n);
    localStorage.setItem("appLogo", applogo);
    localStorage.setItem("defaultmenuid", defaultmenuid);
    localStorage.setItem("PageLanding", PageLanding);
    localStorage.setItem("userSettings", appdata);
    localStorage.setItem("baseUrl", baseUrl);
    localStorage.setItem("parseAppId", appid);
    localStorage.setItem("favicon", favicon);
    setIsLoggingOut(false);
    navigate("/");
  };

  //handle to close profile drop down menu onclick screen
  useEffect(() => {
    const closeMenuOnOutsideClick = (e) => {
      if (isOpen && !e.target.closest("#profile-menu")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", closeMenuOnOutsideClick);

    return () => {
      // Cleanup the event listener when the component unmounts
      document.removeEventListener("click", closeMenuOnOutsideClick);
    };
  }, [isOpen]);


  useEffect(() => {
    const updateThemeStatus = () => {
      const isDarkTheme =
        document.documentElement.getAttribute("data-theme") === "opensigndark";
      setIsDarkTheme(isDarkTheme);
    };
    updateThemeStatus();

    const observer = new MutationObserver(() => {
      updateThemeStatus();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="op-navbar bg-base-100 shadow touch-none">
        <div className="flex-none">
          <button
            className="op-btn op-btn-square op-btn-ghost focus:outline-none hover:bg-transparent op-btn-sm no-animation"
            onClick={showSidebar}
          >
            <i className="fa-light fa-bars text-xl text-base-content"></i>
          </button>
        </div>
        <div className="flex-1 ml-2 flex items-center">
          <div className="h-[25px] md:h-[40px] w-auto overflow-hidden">
            <img
              className="object-contain h-full w-auto"
              src="/images/GCICON.jpg"
              alt="logo"
            />
          </div>
          <span className="ml-2 font-bold text-lg">GCSIGN</span>
        </div>
        {/* Test Mode Indicator */}
        {testMode && (
          <div className="flex items-center mr-2">
            <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
              TEST MODE: {localStorage.getItem("subscriptionTestMode")}
            </div>
          </div>
        )}
        {/* Redesigned Subscription Status Display */}
        {subscriptionStatus && (
          <div className="flex items-center mr-2">
            {subscriptionStatus.isSubscribed ? (
              <div className="flex items-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium">{subscriptionStatus.subscriptionPlan}</span>
                <span className="ml-2">({subscriptionStatus.subscriptionDaysRemaining}d)</span>
              </div>
            ) : subscriptionStatus.isTrialExpired ? (
              <div 
                className="flex items-center bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                onClick={() => navigate("/subscription")}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                <span className="font-medium">Trial Expired</span>
                <span className="ml-2">Upgrade</span>
              </div>
            ) : (
              <div 
                className="flex items-center bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                onClick={() => navigate("/subscription")}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span className="font-medium">Trial</span>
                <span className="ml-2">({subscriptionStatus.trialDaysRemaining}d)</span>
              </div>
            )}
          </div>
        )}
        <div id="profile-menu" className="flex-none gap-2">
          <div>
            <FullScreenButton />
          </div>
          {width >= 768 && (
            <div
              onClick={toggleDropdown}
              className="cursor-pointer w-[35px] h-[35px] rounded-full ring-[1px] ring-offset-2 ring-gray-400 overflow-hidden"
            >
              <img
                className="w-[35px] h-[35px] object-contain"
                src={image}
                alt="img"
              />
            </div>
          )}
          {width >= 768 && (
            <div
              onClick={toggleDropdown}
              role="button"
              tabIndex="0"
              className="cursor-pointer text-base-content text-sm"
            >
              {username && username}
            </div>
          )}
          <div
            className="op-dropdown op-dropdown-open op-dropdown-end"
            id="profile-menu"
          >
            <div
              tabIndex={0}
              role="button"
              onClick={toggleDropdown}
              className="op-btn op-btn-ghost op-btn-xs w-[10px] h-[20px] hover:bg-transparent"
            >
              <i className="fa-light fa-angle-down text-base-content"></i>
            </div>
            <ul
              tabIndex={0}
              className={`mt-3 z-[1] p-2 shadow op-dropdown-open op-menu op-menu-sm op-dropdown-content text-base-content bg-base-100 rounded-box w-56 ${
                isOpen ? "" : "hidden"
              }`}
            >
              {!isConsole && (
                <>
                  <li
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <span>
                      <i className="fa-light fa-user"></i> {t("profile")}
                    </span>
                  </li>
                    <li
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/changepassword");
                      }}
                    >
                      <span>
                        <i className="fa-light fa-lock"></i>{" "}
                        {t("change-password")}
                      </span>
                    </li>
                  <li
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/verify-document");
                    }}
                  >
                    <span>
                      <i className="fa-light fa-check-square"></i>{" "}
                      {t("verify-document")}
                    </span>
                  </li>
                  <li>
                    <span>
                      <i className="fa-light fa-moon"></i>
                      {t("dark-mode")}
                      <span className="text-[10px] font-semibold bg-base-300 text-base-content px-1 rounded-md">
                        BETA
                      </span>
                      <ThemeToggle />
                    </span>
                  </li>
                </>
              )}
              <li onClick={handleLogout}>
                <span>
                  <i className="fa-light fa-arrow-right-from-bracket"></i>{" "}
                  {t("log-out")}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;