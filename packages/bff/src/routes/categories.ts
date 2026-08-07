import { Router } from 'express';
import { getBearerToken, isTaktApiConfigured, taktApiFetch } from '../takt-client';

export const categoriesRouter = Router();

export interface Category {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
}

function toFrontendCategory(category: Omit<Category, "isCustom"> & { userId?: string }): Category {
  return { ...category, isCustom: Boolean(category.userId) };
}

// Initial default global categories
let categories: Category[] = [
  { id: 'cat-global-1', name: 'Reuniões', color: '#38bdf8', isCustom: false }, // sky-400
  { id: 'cat-global-2', name: 'Programação', color: '#10b981', isCustom: false }, // emerald-500
  { id: 'cat-global-3', name: 'Estudo', color: '#a855f7', isCustom: false }, // purple-500
  { id: 'cat-global-4', name: 'Planejamento', color: '#f59e0b', isCustom: false }, // amber-500
];

// GET all categories
categoriesRouter.get('/', async (req, res) => {
  if (isTaktApiConfigured()) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Authorization token is required' });

    try {
      const result = await taktApiFetch<Array<Omit<Category, 'isCustom'> & { userId?: string }>>('/categories', token);
      return res.json(result.map(toFrontendCategory));
    } catch (error: any) {
      return res.status(502).json({ error: error.message || 'Failed to load categories' });
    }
  }

  res.json(categories);
});

// POST create custom category
categoriesRouter.post('/', async (req, res) => {
  const { name, color } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return res.status(400).json({ error: 'Category name cannot be empty' });
  }

  if (trimmedName.length > 50) {
    return res.status(400).json({ error: 'Category name must be maximum 50 characters' });
  }

  if (isTaktApiConfigured()) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Authorization token is required' });

    try {
      const created = await taktApiFetch<Omit<Category, 'isCustom'> & { userId?: string }>('/categories', token, {
          method: 'POST',
          body: JSON.stringify({ name: trimmedName, color }),
        });
      return res.status(201).json(toFrontendCategory(created));
    } catch (error: any) {
      return res.status(502).json({ error: error.message || 'Failed to create category' });
    }
  }

  const hexColor = color && /^#[0-9A-F]{6}$/i.test(color) ? color : '#64748b'; // default slate color

  const newCategory: Category = {
    id: `cat-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: trimmedName,
    color: hexColor,
    isCustom: true,
  };

  categories.push(newCategory);
  res.status(201).json(newCategory);
});

// DELETE delete custom category (Physical deletion)
categoriesRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (isTaktApiConfigured()) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Authorization token is required' });

    try {
      await taktApiFetch<void>(`/categories/${id}`, token, { method: 'DELETE' });
      return res.json({ message: 'Category deleted successfully', id });
    } catch (error: any) {
      return res.status(502).json({ error: error.message || 'Failed to delete category' });
    }
  }

  const categoryIndex = categories.findIndex((c) => c.id === id);

  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const category = categories[categoryIndex];

  if (!category.isCustom) {
    return res.status(403).json({ error: 'Global categories cannot be deleted' });
  }

  // Physical deletion as specified in requirements
  categories.splice(categoryIndex, 1);
  res.json({ message: 'Category deleted successfully', id });
});
