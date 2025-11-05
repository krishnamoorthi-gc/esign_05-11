import { useState, useEffect } from "react";
import { lazyWithRetry, hideUpgradeProgress } from "./utils";
import { checkSubscriptionStatus, showSubscriptionAlert } from "./utils/subscriptionUtils";
import { Routes, Route, BrowserRouter } from "react-router";
import { pdfjs } from "react-pdf";
import Form from "./pages/Form";
import Report from "./pages/Report";
import Dashboard from "./pages/Dashboard";
import HomeLayout from "./layout/HomeLayout";
import PageNotFound from "./pages/PageNotFound";
import ValidateRoute from "./primitives/ValidateRoute";
import Validate from "./primitives/Validate";
import TemplatePlaceholder from "./pages/TemplatePlaceholder";
import SignYourSelf from "./pages/SignyourselfPdf";
import DraftDocument from "./components/pdf/DraftDocument";
import PlaceHolderSign from "./pages/PlaceHolderSign";
import PdfRequestFiles from "./pages/PdfRequestFiles";
import Lazy from "./primitives/LazyPage";
import Loader from "./primitives/Loader";
import UserList from "./pages/UserList";
import SuperAdmin from "./pages/SuperAdmin";
import UserActivity from "./pages/UserActivity";
import { serverUrl_fn } from "./constant/appinfo";
import DocSuccessPage from "./pages/DocSuccessPage";
import ValidateSession from "./primitives/ValidateSession";
import ValidateTrial from "./primitives/ValidateTrial";
import DragProvider from "./components/DragProivder";
import Title from "./components/Title";
import TrialChecker from "./components/TrialChecker";
const DebugPdf = lazyWithRetry(() => import("./pages/DebugPdf"));
const ForgetPassword = lazyWithRetry(() => import("./pages/ForgetPassword"));
const GuestLogin = lazyWithRetry(() => import("./pages/GuestLogin"));
const ChangePassword = lazyWithRetry(() => import("./pages/ChangePassword"));
const UserProfile = lazyWithRetry(() => import("./pages/UserProfile"));
const Opensigndrive = lazyWithRetry(() => import("./pages/Opensigndrive"));
const ManageSign = lazyWithRetry(() => import("./pages/Managesign"));
const AddAdmin = lazyWithRetry(() => import("./pages/AddAdmin"));
const UpdateExistUserAdmin = lazyWithRetry(
  () => import("./pages/UpdateExistUserAdmin")
);
const Preferences = lazyWithRetry(() => import("./pages/Preferences"));
const Subscription = lazyWithRetry(() => import("./pages/Subscription"));
const StripeReturn = lazyWithRetry(() => import("./components/StripeReturn"));
const Webhook = lazyWithRetry(() => import("./pages/Webhook"));
const APIToken = lazyWithRetry(() => import("./pages/APIToken"));
const ZapierIntegration = lazyWithRetry(() => import("./pages/ZapierIntegration"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const VerifyDocument = lazyWithRetry(() => import("./pages/VerifyDocument"));
const SignForms = lazyWithRetry(() => import("./pages/SignForms"));
const SignFormViewer = lazyWithRetry(() => import("./pages/SignFormViewer"));
const TestPublicSignForm = lazyWithRetry(() => import("./pages/TestPublicSignForm"));
const PublicSignForms = lazyWithRetry(() => import("./pages/PublicSignForms"));
const PublicSignFormViewer = lazyWithRetry(() => import("./pages/PublicSignFormViewer"));

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
const AppLoader = () => {
  return (
    <div className="flex justify-center items-center h-[100vh]">
      <Loader />
    </div>
  );
};
function App() {
  const [isloading, setIsLoading] = useState(true);
  useEffect(() => {
    // initialize creds
    const id = process.env.REACT_APP_APPID ?? "opensign";
    localStorage.setItem("parseAppId", id);
    localStorage.setItem("baseUrl", `${serverUrl_fn()}/`);
    hideUpgradeProgress();
    localStorage.removeItem("showUpgradeProgress");
    setIsLoading(false);
    checkSubscriptionOnLoad();
  }, []);

  const checkSubscriptionOnLoad = async () => {
    try {
      const status = await checkSubscriptionStatus();
      // Show alert if user doesn't have access
      if (!status.hasAccess) {
        showSubscriptionAlert(status);
      }
    } catch (error) {
      console.log("Error checking subscription status:", error);
    }
  };

  return (
    <div className="bg-base-200">
      {isloading ? (
        <AppLoader />
      ) : (
        <BrowserRouter>
          <Title />
          <TrialChecker />
          {/* Subscription Tester removed for production */}
          <Routes>
            <Route element={<ValidateRoute />}>
              <Route exact path="/" element={<Lazy Page={Login} />} />
                  <Route path="/addadmin" element={<Lazy Page={AddAdmin} />} />
                  <Route
                    path="/upgrade-2.1"
                    element={<Lazy Page={UpdateExistUserAdmin} />}
                  />
            </Route>
            <Route element={<Validate />}>
              <Route
                exact
                path="/load/recipientSignPdf/:docId/:contactBookId"
                element={<DragProvider Page={PdfRequestFiles} />}
              />
            </Route>
            <Route
              path="/login/:base64url"
              element={<Lazy Page={GuestLogin} />}
            />
            <Route path="/debugpdf" element={<Lazy Page={DebugPdf} />} />
              <Route
                path="/forgetpassword"
                element={<Lazy Page={ForgetPassword} />}
              />
            <Route
              element={
                <ValidateSession>
                  <ValidateTrial>
                    <HomeLayout />
                  </ValidateTrial>
                </ValidateSession>
              }
            >
                  <Route path="/users" element={<UserList />} />
                  <Route path="/superadmin" element={<SuperAdmin />} />
                  <Route path="/useractivity/:userId" element={<UserActivity />} />
                  <Route
                    path="/changepassword"
                    element={<Lazy Page={ChangePassword} />}
                  />
              <Route path="/form/:id" element={<Form />} />
              <Route path="/report/:id" element={<Report />} />
              <Route path="/dashboard/:id" element={<Dashboard />} />
              <Route path="/profile" element={<Lazy Page={UserProfile} />} />
              <Route path="/drive" element={<Lazy Page={Opensigndrive} />} />
              <Route path="/managesign" element={<Lazy Page={ManageSign} />} />
              <Route path="/subscription" element={<Lazy Page={Subscription} />} />
              <Route path="/subscription/return" element={<Lazy Page={StripeReturn} />} />
              <Route
                path="/template/:templateId"
                element={<DragProvider Page={TemplatePlaceholder} />}
              />
              {/* signyouself route with no rowlevel data using docId from url */}
              <Route
                path="/signaturePdf/:docId"
                element={<DragProvider Page={SignYourSelf} />}
              />
              {/* draft document route to handle and navigate route page according to document status */}
              <Route
                path="/draftDocument"
                element={<DragProvider Page={DraftDocument} />}
              />
              {/* recipient placeholder set route with no rowlevel data using docId from url*/}
              <Route
                path="/placeHolderSign/:docId"
                element={<DragProvider Page={PlaceHolderSign} />}
              />
              {/* recipient signature route with no rowlevel data using docId from url */}
              <Route
                path="/recipientSignPdf/:docId/:contactBookId"
                element={<DragProvider Page={PdfRequestFiles} />}
              />
              <Route
                path="/recipientSignPdf/:docId"
                element={<DragProvider Page={PdfRequestFiles} />}
              />
              <Route
                path="/verify-document"
                element={<Lazy Page={VerifyDocument} />}
              />
              <Route
                path="/preferences"
                element={<Lazy Page={Preferences} />}
              />
              <Route
                path="/webhook"
                element={<Lazy Page={Webhook} />}
              />
              <Route
                path="/apitoken"
                element={<Lazy Page={APIToken} />}
              />
              <Route
                path="/zapier"
                element={<Lazy Page={ZapierIntegration} />}
              />
              <Route
                path="/signforms"
                element={<Lazy Page={SignForms} />}
              />
              <Route
                path="/signform/:docId"
                element={<Lazy Page={SignFormViewer} />}
              />
              <Route
                path="/testpublicsignform"
                element={<Lazy Page={TestPublicSignForm} />}
              />
              <Route
                path="/publicsignforms"
                element={<Lazy Page={PublicSignForms} />}
              />
              <Route
                path="/publicsignform/:formId"
                element={<Lazy Page={PublicSignFormViewer} />}
              />
            </Route>
            <Route path="/success" element={<DocSuccessPage />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;