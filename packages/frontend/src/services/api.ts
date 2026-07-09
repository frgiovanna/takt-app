const API_BASE_URL = "http://localhost:3000/api";

// Helper to handle fetch requests
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
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
  name: string;
  email: string;
  role: string;
  level: string;
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

export const api = {
  // Auth
  login: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }> => {
    try {
      const data = await apiFetch<{ token: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      localStorage.setItem("takt_token", data.token);
      localStorage.setItem("takt_user", JSON.stringify(data.user));
      return data;
    } catch (err) {
      console.warn("BFF Login failed, running in mock/offline mode:", err);
      // Mock Fallback
      if (password.length >= 4) {
        const mockData = {
          token: "mock-local-token-xyz-98765",
          user: {
            id: "usr-local",
            name: "Giovanna Freitas (Offline)",
            email: email,
            role: "Product Lead",
            level: "Senior",
            weeklyTargetHours: 40,
          },
        };
        localStorage.setItem("takt_token", mockData.token);
        localStorage.setItem("takt_user", JSON.stringify(mockData.user));
        return mockData;
      }
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("takt_token");
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
  getActivities: async (): Promise<Activity[]> => {
    try {
      return await apiFetch<Activity[]>("/activities");
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
      return await apiFetch<Activity>("/activities", {
        method: "POST",
        body: JSON.stringify(activity),
      });
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
      return await apiFetch<Activity>(`/activities/${id}`, {
        method: "PUT",
        body: JSON.stringify(activity),
      });
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
      await apiFetch<void>(`/activities/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete activity on BFF, deleting locally:", err);
      const list = await api.getActivities();
      const filtered = list.filter((a) => a.id !== id);
      localStorage.setItem("takt_activities", JSON.stringify(filtered));
    }
  },
};
