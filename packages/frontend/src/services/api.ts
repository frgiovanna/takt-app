const API_BASE_URL = "http://localhost:3000/api";

interface BackendTimeEntry {
  id: string;
  categoryId: string;
  title: string;
  startDate: string;
  endDate: string;
  productivityLevelId?: string;
  note?: string;
}

interface BackendCategory {
  id: string;
  name: string;
  color: string;
  userId?: string;
}

interface BackendProductivityLevel {
  id: string;
  displayOrder?: number;
  name: string;
}

export interface CalendarResponse {
  date: string;
  startDate: string;
  endDate: string;
  timeEntries: BackendTimeEntry[];
  categories: BackendCategory[];
  productivityLevels: BackendProductivityLevel[];
}

// Helper to handle fetch requests
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const token = localStorage.getItem("takt_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retryOnUnauthorized && endpoint !== "/auth/refresh") {
    const refreshed = await api.refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(endpoint, options, false);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error || `HTTP error! status: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: string;
  level: string;
  areaOfActuation?: string;
  weeklyTargetHours: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
}

export interface Activity {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  startTime: string;
  endTime: string;
  productivityLevel: 1 | 2 | 3 | 4;
  note?: string;
  title: string;
}

export type ActivityPayload = Omit<Activity, "id">;

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInMs?: number;
  user: User;
}

let calendarContext: Pick<CalendarResponse, "categories" | "productivityLevels"> = {
  categories: [],
  productivityLevels: [],
};

function levelNumber(levelId?: string): 1 | 2 | 3 | 4 {
  const level = calendarContext.productivityLevels.find((item) => item.id === levelId);
  const order = level?.displayOrder || calendarContext.productivityLevels.indexOf(level!) + 1;
  return Math.min(4, Math.max(1, order || 1)) as 1 | 2 | 3 | 4;
}

function levelId(level: number) {
  const ordered = [...calendarContext.productivityLevels].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  );
  return ordered[level - 1]?.id;
}

function toFrontendActivity(entry: BackendTimeEntry): Activity {
  const category = calendarContext.categories.find((item) => item.id === entry.categoryId);
  return {
    id: entry.id,
    categoryId: entry.categoryId,
    categoryName: category?.name || "Categoria",
    categoryColor: category?.color || "#64748b",
    startTime: new Date(entry.startDate).toISOString(),
    endTime: new Date(entry.endDate).toISOString(),
    productivityLevel: levelNumber(entry.productivityLevelId),
    note: entry.note,
    title: entry.title,
  };
}

function persistSession(data: AuthSession) {
  persistTokens(data);
  localStorage.setItem("takt_user", JSON.stringify(data.user));
}

function persistTokens(data: Pick<AuthSession, "accessToken" | "refreshToken" | "accessTokenExpiresInMs">) {
  localStorage.setItem("takt_token", data.accessToken);
  localStorage.setItem("takt_access_token", data.accessToken);
  localStorage.setItem("takt_refresh_token", data.refreshToken);
  if (data.accessTokenExpiresInMs !== undefined) {
    localStorage.setItem(
      "takt_access_token_expires_in_ms",
      String(data.accessTokenExpiresInMs),
    );
  }
}

export const api = {
  // Auth
  login: async (
    username: string,
    password: string,
  ): Promise<AuthSession> => {
    const data = await apiFetch<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    persistSession(data);
    return data;
  },

  register: async (
    username: string,
    email: string,
    password: string,
  ): Promise<AuthSession> => {
    const data = await apiFetch<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    persistSession(data);
    return data;
  },

  refreshAccessToken: async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("takt_refresh_token");
    if (!refreshToken) return false;

    try {
      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresInMs?: number;
      }>(
        "/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        false,
      );
      persistTokens(data);
      return true;
    } catch (err) {
      console.warn("Failed to refresh access token:", err);
      return false;
    }
  },

  logout: () => {
    const refreshToken = localStorage.getItem("takt_refresh_token");
    if (refreshToken) {
      apiFetch<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch((err) => {
        console.warn("Failed to logout from BFF:", err);
      });
    }
    localStorage.removeItem("takt_token");
    localStorage.removeItem("takt_access_token");
    localStorage.removeItem("takt_refresh_token");
    localStorage.removeItem("takt_access_token_expires_in_ms");
    localStorage.removeItem("takt_user");
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("takt_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    try {
      return await apiFetch<Category[]>("/categories");
    } catch (err) {
      console.warn(
        "Failed to fetch categories from BFF, using local storage fallback:",
        err,
      );
      const local = localStorage.getItem("takt_categories");
      if (local) return JSON.parse(local);

      const defaults: Category[] = [
        {
          id: "cat-global-1",
          name: "Reuniões",
          color: "#38bdf8",
          isCustom: false,
        },
        {
          id: "cat-global-2",
          name: "Programação",
          color: "#10b981",
          isCustom: false,
        },
        {
          id: "cat-global-3",
          name: "Estudo",
          color: "#a855f7",
          isCustom: false,
        },
        {
          id: "cat-global-4",
          name: "Planejamento",
          color: "#f59e0b",
          isCustom: false,
        },
      ];
      localStorage.setItem("takt_categories", JSON.stringify(defaults));
      return defaults;
    }
  },

  createCategory: async (name: string, color: string): Promise<Category> => {
    try {
      return await apiFetch<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({ name, color }),
      });
    } catch (err) {
      console.warn("Failed to create category on BFF, saving locally:", err);
      if (name.length > 50)
        throw new Error("Category name must be maximum 50 characters");
      const categories = await api.getCategories();
      const newCat: Category = {
        id: `cat-custom-local-${Date.now()}`,
        name: name.trim(),
        color,
        isCustom: true,
      };
      categories.push(newCat);
      localStorage.setItem("takt_categories", JSON.stringify(categories));
      return newCat;
    }
  },

  deleteCategory: async (id: string): Promise<void> => {
    try {
      await apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete category on BFF, deleting locally:", err);
      const categories = await api.getCategories();
      const filtered = categories.filter((c) => c.id !== id);
      localStorage.setItem("takt_categories", JSON.stringify(filtered));
    }
  },

  // Activities
  getCalendar: async (startDate: string, endDate: string): Promise<CalendarResponse> => {
    try {
      const data = await apiFetch<CalendarResponse>(
        `/calendar?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      );
      calendarContext = data;
      return data;
    } catch (err) {
      console.warn("Failed to fetch calendar from BFF, using local data:", err);
      const [categories, activities] = await Promise.all([
        api.getCategories(),
        api.getActivities(),
      ]);
      return {
        date: startDate,
        startDate,
        endDate,
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          color: category.color,
        })),
        productivityLevels: [],
        timeEntries: activities.map((activity) => ({
          id: activity.id,
          categoryId: activity.categoryId,
          title: activity.title,
          startDate: activity.startTime,
          endDate: activity.endTime,
          note: activity.note,
        })),
      };
    }
  },

  getActivities: async (): Promise<Activity[]> => {
    try {
      const entries = await apiFetch<BackendTimeEntry[]>("/time-entries");
      return entries.map(toFrontendActivity);
    } catch (err) {
      console.warn(
        "Failed to fetch activities from BFF, using local storage fallback:",
        err,
      );
      const local = localStorage.getItem("takt_activities");
      return local ? JSON.parse(local) : [];
    }
  },

  createActivity: async (activity: ActivityPayload): Promise<Activity> => {
    try {
      const created = await apiFetch<BackendTimeEntry>("/time-entries", {
        method: "POST",
        body: JSON.stringify({
          categoryId: activity.categoryId,
          title: activity.title,
          startDate: activity.startTime,
          endDate: activity.endTime,
          productivityLevelId: levelId(activity.productivityLevel),
          note: activity.note,
        }),
      });
      return toFrontendActivity(created);
    } catch (err) {
      console.warn("Failed to create activity on BFF, saving locally:", err);
      if (activity.note && activity.note.length > 500) {
        throw new Error("Note cannot exceed 500 characters");
      }
      const list = await api.getActivities();
      const newAct: Activity = {
        ...activity,
        id: `act-local-${Date.now()}`,
      };
      list.push(newAct);
      localStorage.setItem("takt_activities", JSON.stringify(list));
      return newAct;
    }
  },

  updateActivity: async (
    id: string,
    activity: ActivityPayload,
  ): Promise<Activity> => {
    try {
      const updated = await apiFetch<BackendTimeEntry>(`/time-entries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: activity.categoryId,
          title: activity.title,
          startDate: activity.startTime,
          endDate: activity.endTime,
          productivityLevelId: levelId(activity.productivityLevel),
          note: activity.note,
        }),
      });
      return toFrontendActivity(updated);
    } catch (err) {
      console.warn("Failed to update activity on BFF, updating locally:", err);
      if (activity.note && activity.note.length > 500) {
        throw new Error("Note cannot exceed 500 characters");
      }

      const list = await api.getActivities();
      const index = list.findIndex((a) => a.id === id);
      if (index === -1) {
        throw new Error("Activity not found");
      }

      const updated: Activity = {
        ...activity,
        id,
      };
      list[index] = updated;
      localStorage.setItem("takt_activities", JSON.stringify(list));
      return updated;
    }
  },

  deleteActivity: async (id: string): Promise<void> => {
    try {
      await apiFetch<void>(`/time-entries/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete activity on BFF, deleting locally:", err);
      const list = await api.getActivities();
      const filtered = list.filter((a) => a.id !== id);
      localStorage.setItem("takt_activities", JSON.stringify(filtered));
    }
  },
};
