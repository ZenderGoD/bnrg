/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_cleanupInvalidUsers from "../admin/cleanupInvalidUsers.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as betterAuth_user_metadata from "../betterAuth/user_metadata.js";
import type * as cart from "../cart.js";
import type * as chats from "../chats.js";
import type * as contact from "../contact.js";
import type * as credits from "../credits.js";
import type * as discordNotifications from "../discordNotifications.js";
import type * as discounts from "../discounts.js";
import type * as files from "../files.js";
import type * as filters from "../filters.js";
import type * as homepage from "../homepage.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/cleanupInvalidUsers": typeof admin_cleanupInvalidUsers;
  analytics: typeof analytics;
  auth: typeof auth;
  "betterAuth/user_metadata": typeof betterAuth_user_metadata;
  cart: typeof cart;
  chats: typeof chats;
  contact: typeof contact;
  credits: typeof credits;
  discordNotifications: typeof discordNotifications;
  discounts: typeof discounts;
  files: typeof files;
  filters: typeof filters;
  homepage: typeof homepage;
  orders: typeof orders;
  payments: typeof payments;
  products: typeof products;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
