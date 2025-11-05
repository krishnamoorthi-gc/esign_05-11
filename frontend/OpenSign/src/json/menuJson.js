const userssetting = [
  {
    icon: "fa-light fa-users fa-fw",
    title: "Users",
    target: "_self",
    pageType: "",
    description: "",
    objectId: "users"
  }
];

// Webhook menu item
const webhookMenu = {
  icon: "fa-light fa-globe",
  title: "Webhook",
  target: "_self",
  pageType: "",
  description: "",
  objectId: "webhook"
};

// API Token menu item
const apiTokenMenu = {
  icon: "fa-light fa-key",
  title: "API Token",
  target: "_self",
  pageType: "",
  description: "",
  objectId: "apitoken"
};

// Zapier Integration menu item
const zapierIntegrationMenu = {
  icon: "fa-light fa-bolt",
  title: "Zapier Integration",
  target: "_self",
  pageType: "",
  description: "",
  objectId: "zapier"
};

export const subSetting = [
  {
    icon: "fa-light fa-sliders",
    title: "Preferences",
    target: "_self",
    pageType: "",
    description: "",
    objectId: "preferences"
  },
  ...userssetting
];

// SuperAdmin menu item
const superAdminMenu = {
  icon: "fa-light fa-user-shield",
  title: "SuperAdmin",
  target: "_self",
  pageType: "",
  description: "",
  objectId: "superadmin"
};

// API menu item
const apiMenu = {
  icon: "fa-light fa-code",
  title: "API",
  target: "_self",
  pageType: null,
  description: "",
  objectId: null,
  children: [apiTokenMenu, webhookMenu, zapierIntegrationMenu]
};

// Note: The API menu is placed in the main sidebarList so it's visible to all users
// API Token and Webhook were moved from Settings submenu to this dedicated API menu
const sidebarList = [
  {
    icon: "fa-light fa-tachometer-alt",
    title: "Dashboard",
    target: "",
    pageType: "dashboard",
    description: "",
    objectId: "35KBoSgoAK"
  },
  {
    icon: "fa-light fa-pen-nib",
    title: "Sign yourself",
    target: "_self",
    pageType: "form",
    description: "",
    objectId: "sHAnZphf69"
  },
  {
    icon: "fa-light fa-paper-plane",
    title: "Request signatures",
    target: "_self",
    pageType: "form",
    description: "",
    objectId: "8mZzFxbG1z"
  },
  {
    icon: "fa-light fa-newspaper",
    title: "Templates",
    target: "_self",
    pageType: null,
    description: null,
    objectId: null,
    children: [
      {
        icon: "fa-light fa-file-signature",
        title: "Create template",
        target: "_self",
        pageType: "form",
        description: "",
        objectId: "template"
      },
      {
        icon: "fa-light fa-file-contract",
        title: "Manage templates",
        target: "_self",
        pageType: "report",
        description: "",
        objectId: "6TeaPr321t"
      }
    ]
  },
  {
    icon: "fa-light fa-folder",
    title: "GCSIGN Drive",
    target: "_self",
    pageType: "",
    description: "",
    objectId: "drive"
  },
  {
    icon: "fa-light fa-address-card",
    title: "Documents",
    target: "_self",
    pageType: null,
    description: "",
    objectId: null,
    children: [
      {
        icon: "fa-light fa-signature",
        title: "Need your sign",
        target: "_self",
        pageType: "report",
        description: "",
        objectId: "4Hhwbp482K"
      },
      {
        icon: "fa-light fa-tasks",
        title: "In Progress",
        target: "_self",
        pageType: "report",
        description: "",
        objectId: "1MwEuxLEkF"
      },
      {
        icon: "fa-light fa-check-circle",
        title: "Completed",
        target: "_self",
        pageType: "report",
        description: "",
        objectId: "kQUoW4hUXz"
      },
      {
        icon: "fa-light fa-edit",
        title: "Drafts",
        target: "_self",
        pageType: "report",
        description: "",
        objectId: "ByHuevtCFY"
      },
      {
        icon: "fa-light fa-times-circle",
        title: "Declined",
        target: "_self",
        pageType: "report",
        description: "",
        objectId: "UPr2Fm5WY3"
      },
      {
        icon: "fa-light fa-hourglass-end",
        title: "Expired",
        target: "_self",
        pageType: "report",
        description: "",
        objectId: "zNqBHXHsYH"
      }
    ]
  },
  // Commenting out SignForms and Public SignForms options to hide them
  /*
  {
    icon: "fa-light fa-file-signature",
    title: "SignForms",
    target: "_self",
    pageType: "form",
    description: "Collect signatures using publicly shareable forms",
    objectId: "signforms"
  },
  {
    icon: "fa-light fa-file-signature",
    title: "Public SignForms",
    target: "_self",
    pageType: "form",
    description: "Create and manage public sign forms",
    objectId: "publicsignforms"
  },
  */
  {
    icon: "fa-light fa-address-book",
    title: "Contactbook",
    target: "_self",
    pageType: "report",
    description: "",
    objectId: "contacts"
  },
  {
    icon: "fa-light fa-credit-card",
    title: "Subscription",
    target: "_self",
    pageType: "",
    description: "",
    objectId: "subscription"
  },
  // SuperAdmin menu item
  superAdminMenu,
  // API menu item
  apiMenu,
  {
    icon: "fa-light fa-cog",
    title: "Settings",
    target: "_self",
    pageType: null,
    description: "",
    objectId: null,
    children: [
      {
        icon: "fa-light fa-pen-fancy",
        title: "My Signature",
        target: "_self",
        pageType: "",
        description: "",
        objectId: "managesign"
      }
    ]
  }
];

export default sidebarList;
