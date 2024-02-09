// @ts-nocheck
"use strict";

import { BinaryXmlParser } from "./binaryxml";

// const NS_ANDROID = 'http://schemas.android.com/apk/res/android'
const INTENT_MAIN = "android.intent.action.MAIN";
const CATEGORY_LAUNCHER = "android.intent.category.LAUNCHER";
const CATEGORY_LEANBACK_LAUNCHER = "android.intent.category.LEANBACK_LAUNCHER";

export class ManifestParser {
  buffer: Buffer;
  xmlParser: BinaryXmlParser;
  constructor(buffer: Buffer, options = {}) {
    this.buffer = buffer;
    this.xmlParser = new BinaryXmlParser(this.buffer, options as any);
  }

  collapseAttributes(element) {
    const collapsed = Object.create(null);
    for (let attr of Array.from(element.attributes)) {
      collapsed[attr.name] = attr.typedValue.value;
    }
    return collapsed;
  }

  parseIntents(element, target) {
    target.intentFilters = [];
    target.metaData = [];

    return element.childNodes.forEach((element) => {
      switch (element.nodeName) {
        case "intent-filter": {
          const intentFilter = this.collapseAttributes(element);

          intentFilter.actions = [];
          intentFilter.categories = [];
          intentFilter.data = [];

          element.childNodes.forEach((element) => {
            switch (element.nodeName) {
              case "action":
                intentFilter.actions.push(this.collapseAttributes(element));
                break;
              case "category":
                intentFilter.categories.push(this.collapseAttributes(element));
                break;
              case "data":
                intentFilter.data.push(this.collapseAttributes(element));
                break;
            }
          });

          target.intentFilters.push(intentFilter);
          break;
        }
        case "meta-data":
          target.metaData.push(this.collapseAttributes(element));
          break;
      }
    });
  }

  parseApplication(element) {
    const app = this.collapseAttributes(element);

    app.activities = [];
    app.activityAliases = [];
    app.launcherActivities = [];
    app.leanbackLauncherActivities = [];
    app.services = [];
    app.receivers = [];
    app.providers = [];
    app.usesLibraries = [];

    element.childNodes.forEach((element) => {
      switch (element.nodeName) {
        case "activity": {
          const activity = this.collapseAttributes(element);
          this.parseIntents(element, activity);
          app.activities.push(activity);
          if (this.isLauncherActivity(activity)) {
            app.launcherActivities.push(activity);
          }
          if (this.isLeanbackLauncherActivity(activity)) {
            app.leanbackLauncherActivities.push(activity);
          }
          break;
        }
        case "activity-alias": {
          const activityAlias = this.collapseAttributes(element);
          this.parseIntents(element, activityAlias);
          app.activityAliases.push(activityAlias);
          if (this.isLauncherActivity(activityAlias)) {
            app.launcherActivities.push(activityAlias);
          }
          if (this.isLeanbackLauncherActivity(activityAlias)) {
            app.leanbackLauncherActivities.push(activityAlias);
          }
          break;
        }
        case "service": {
          const service = this.collapseAttributes(element);
          this.parseIntents(element, service);
          app.services.push(service);
          break;
        }
        case "receiver": {
          const receiver = this.collapseAttributes(element);
          this.parseIntents(element, receiver);
          app.receivers.push(receiver);
          break;
        }
        case "provider": {
          const provider = this.collapseAttributes(element);

          provider.grantUriPermissions = [];
          provider.metaData = [];
          provider.pathPermissions = [];

          element.childNodes.forEach((element) => {
            switch (element.nodeName) {
              case "grant-uri-permission":
                provider.grantUriPermissions.push(
                  this.collapseAttributes(element)
                );
                break;
              case "meta-data":
                provider.metaData.push(this.collapseAttributes(element));
                break;
              case "path-permission":
                provider.pathPermissions.push(this.collapseAttributes(element));
                break;
            }
          });

          app.providers.push(provider);
          break;
        }
        case "uses-library":
          app.usesLibraries.push(this.collapseAttributes(element));
          break;
      }
    });

    return app;
  }

  isLauncherActivity(activity) {
    return activity.intentFilters.some(function (filter) {
      const hasMain = filter.actions.some(
        (action) => action.name === INTENT_MAIN
      );
      if (!hasMain) {
        return false;
      }
      return filter.categories.some(
        (category) => category.name === CATEGORY_LAUNCHER
      );
    });
  }

  isLeanbackLauncherActivity(activity) {
    return activity.intentFilters.some(function (filter) {
      const hasMain = filter.actions.some(
        (action) => action.name === INTENT_MAIN
      );
      if (!hasMain) {
        return false;
      }
      return filter.categories.some(
        (category) => category.name === CATEGORY_LEANBACK_LAUNCHER
      );
    });
  }

  parse() {
    const document = this.xmlParser.parse();
    const manifest = this.collapseAttributes(document);

    manifest.usesPermissions = [];
    manifest.permissions = [];
    manifest.permissionTrees = [];
    manifest.permissionGroups = [];
    manifest.instrumentation = null;
    manifest.usesSdk = null;
    manifest.usesConfiguration = null;
    manifest.usesFeatures = [];
    manifest.supportsScreens = null;
    manifest.compatibleScreens = [];
    manifest.supportsGlTextures = [];
    manifest.application = Object.create(null);

    document.childNodes.forEach((element) => {
      switch (element.nodeName) {
        case "uses-permission":
          manifest.usesPermissions.push(this.collapseAttributes(element));
          break;
        case "permission":
          manifest.permissions.push(this.collapseAttributes(element));
          break;
        case "permission-tree":
          manifest.permissionTrees.push(this.collapseAttributes(element));
          break;
        case "permission-group":
          manifest.permissionGroups.push(this.collapseAttributes(element));
          break;
        case "instrumentation":
          manifest.instrumentation = this.collapseAttributes(element);
          break;
        case "uses-sdk":
          manifest.usesSdk = this.collapseAttributes(element);
          break;
        case "uses-configuration":
          manifest.usesConfiguration = this.collapseAttributes(element);
          break;
        case "uses-feature":
          manifest.usesFeatures.push(this.collapseAttributes(element));
          break;
        case "supports-screens":
          manifest.supportsScreens = this.collapseAttributes(element);
          break;
        case "compatible-screens":
          element.childNodes.forEach((screen) => {
            return manifest.compatibleScreens.push(
              this.collapseAttributes(screen)
            );
          });
          break;
        case "supports-gl-texture":
          manifest.supportsGlTextures.push(this.collapseAttributes(element));
          break;
        case "application":
        case "com.stub.StubApp": // 360 encryption services (adbkit-apkreader#13)
          manifest.application = this.parseApplication(element);
          break;
      }
    });

    return manifest;
  }
}


