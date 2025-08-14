import React, { useMemo, useState } from 'react';
import Home from './components/Home';
import Brew from './components/Brew';
import { RECIPES } from './recipes';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [activeId, setActiveId] = useState(RECIPES[0].id);
  const activeRecipe = useMemo(() => RECIPES.find(r => r.id === activeId), [activeId]);

  return screen === 'home' ? (
    <Home recipes={RECIPES} onSelect={(id) => { setActiveId(id); setScreen('brew'); }} />
  ) : (
    <Brew recipe={activeRecipe} onBack={() => setScreen('home')} />
  );
}
