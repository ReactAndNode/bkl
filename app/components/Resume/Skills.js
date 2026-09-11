'use client';

import { useState } from 'react';
import CategoryButton from './Skills/CategoryButton';
import SkillBar from './Skills/SkillBar';

export default function Skills({ skills = [], categories = [] }) {
  const [active, setActive] = useState('All');
  const sortedSkills = skills.map(skill => ({ ...skill, category: [...skill.category].sort() }))
    .sort((a, b) => b.compentency - a.compentency
      || b.category[0].localeCompare(a.category[0]) || a.title.localeCompare(b.title));
  const visibleSkills = sortedSkills.filter(skill => active === 'All' || skill.category.includes(active));

  return (
    <div className="skills">
      <div className="link-to" id="skills" />
      <div className="title"><h3>Skills</h3></div>
      <div className="skill-button-container">
        {['All', ...categories.map(category => category.name)].map(label => (
          <CategoryButton key={label} label={label} active={active === label}
            handleClick={() => setActive(active === label ? 'All' : label)} />
        ))}
      </div>
      <div className="skill-row-container">
        {visibleSkills.map(skill => <SkillBar key={skill.title} data={skill} categories={categories} />)}
      </div>
    </div>
  );
}
