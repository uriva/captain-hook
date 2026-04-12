const perms = {
  routes: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: ["isOwner", "auth.id in data.ref('owner.id')"],
  },
  secrets: {
    allow: {
      view: "auth.id in data.ref('route.owner.id')",
      create: "auth.id != ''",
      update: "auth.id in data.ref('route.owner.id')",
      delete: "auth.id in data.ref('route.owner.id')",
    },
  },
  events: {
    allow: {
      view: "auth.id in data.ref('route.owner.id')",
      create: "true",
      update: "false",
      delete: "auth.id in data.ref('route.owner.id')",
    },
  },
};

export { perms as default };
