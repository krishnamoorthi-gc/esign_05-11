import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

const Menu = ({ item, isOpen, closeSidebar }) => {
  const appName =
    "OpenSign™";
  const drivename = appName === "OpenSign™" ? "OpenSign™" : "";
  const { t } = useTranslation();
  return (
    <li key={item.title} role="none" className="my-0.5">
      <NavLink
        to={
          item.pageType
            ? `/${item.pageType}/${item.objectId}`
            : `/${item.objectId}`
        }
        className={({ isActive }) =>
          `${
            isActive ? " bg-accent text-accent-content" : ""
          } flex gap-x-5 items-center justify-start text-left p-3 text-secondary-content hover:text-accent-content focus:bg-accent hover:bg-accent hover:no-underline focus:outline-none`
        }
        onClick={closeSidebar}
        tabIndex={isOpen ? 0 : -1}
        role="menuitem"
      >
        <span className="w-[20px] h-[20px] flex justify-center">
          <i className={`${item.icon} text-[20px] text-secondary-content`} aria-hidden="true"></i>
        </span>
        <span className="flex items-center mb-0.5 text-secondary-content">
          {item.title === "GCSIGN Drive" ? item.title : t(`sidebar.${item.title}`, { appName: drivename })}
        </span>
      </NavLink>
    </li>
  );
};

export default Menu;