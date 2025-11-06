import React from 'react';

function normalizeBadges(badges){
  if (!Array.isArray(badges)) return [];
  return badges
    .map((badge) => {
      if (!badge) return null;
      if (typeof badge === 'string') {
        return { label: badge, tone: 'default' };
      }
      if (React.isValidElement(badge)) {
        return { element: badge };
      }
      if (typeof badge === 'object') {
        const { label, tone = 'default', element } = badge;
        if (element && React.isValidElement(element)) {
          return { element };
        }
        if (!label) return null;
        return { label, tone };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeActions(actions){
  if (!actions) return [];
  return (Array.isArray(actions) ? actions : [actions]).filter(Boolean);
}

export default function Section({
  title,
  subtitle,
  badges = [],
  actions,
  children,
  className = '',
  id,
  headerAside,
}) {
  const normalizedBadges = normalizeBadges(badges);
  const actionNodes = normalizeActions(actions);
  const hasHeader = Boolean(
    title ||
    subtitle ||
    normalizedBadges.length ||
    actionNodes.length ||
    headerAside
  );

  return (
    <section className={["ne-section", className].filter(Boolean).join(' ')} id={id}>
      {hasHeader && (
        <header className="ne-section__header">
          {(title || subtitle || normalizedBadges.length) && (
            <div className="ne-section__heading">
              {title && <h2 className="ne-section__title">{title}</h2>}
              {subtitle && <p className="ne-section__subtitle">{subtitle}</p>}
              {normalizedBadges.length > 0 && (
                <div className="ne-section__badges">
                  {normalizedBadges.map((badge, idx) => {
                    if (badge.element) {
                      return React.cloneElement(badge.element, { key: idx });
                    }
                    const toneClass = badge.tone && badge.tone !== 'default'
                      ? ` ne-badge--${badge.tone}`
                      : '';
                    return (
                      <span key={idx} className={`ne-badge${toneClass}`}>
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {(actionNodes.length > 0 || headerAside) && (
            <div className="ne-section__actions">
              {headerAside && (
                React.isValidElement(headerAside)
                  ? React.cloneElement(headerAside)
                  : <span>{headerAside}</span>
              )}
              {actionNodes.map((node, idx) => (
                React.isValidElement(node)
                  ? React.cloneElement(node, { key: idx })
                  : <span key={idx}>{node}</span>
              ))}
            </div>
          )}
        </header>
      )}
      <div className="ne-section__body">
        {children}
      </div>
    </section>
  );
}
