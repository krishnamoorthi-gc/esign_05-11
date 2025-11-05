import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/dark-theme-improvements.css";
import App from "./App";
import { showUpgradeProgress, hideUpgradeProgress } from "./utils";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import Parse from "parse";
import "./polyfills";
import { serverUrl_fn, appInfo } from "./constant/appinfo";
import "./i18n";
import { isValidDataUrl } from "./utils/faviconUtils";

const appId =
  import.meta.env.VITE_APPID || process.env.REACT_APP_APPID || "opensign";
const serverUrl = serverUrl_fn();
Parse.initialize(appId);
Parse.serverURL = serverUrl;

if (localStorage.getItem("showUpgradeProgress")) {
  showUpgradeProgress();
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "opensigndark");
}

// Ensure we have a valid favicon
const currentFavicon = localStorage.getItem("favicon");
if (!currentFavicon || !isValidDataUrl(currentFavicon)) {
  // Set the default favicon from appInfo if none exists or it's invalid
  localStorage.setItem("favicon", appInfo.fev_Icon);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

hideUpgradeProgress();
localStorage.removeItem("showUpgradeProgress");