import { Router } from 'express';

export const categoriesRouter = Router();

export interface Category {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
}

// Initial default global categories
let categories: Category[] = [
  { id: 'cat-global-1', name: 'Reuniões', color: '#38bdf8', isCustom: false }, // sky-400
  { id: 'cat-global-2', name: 'Programação', color: '#10b981', isCustom: false }, // emerald-500
  { id: 'cat-global-3', name: 'Estudo', color: '#a855f7', isCustom: false }, // purple-500
  { id: 'cat-global-4', name: 'Planejamento', color: '#f59e0b', isCustom: false }, // amber-500
];

// GET all categories
categoriesRouter.get('/', (_req, res) => {
  res.json(categories);
});

// POST create custom category
categoriesRouter.post('/', (req, res) => {
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
categoriesRouter.delete('/:id', (req, res) => {
  const { id } = req.params;

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
