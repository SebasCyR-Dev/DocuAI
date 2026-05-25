# Contribuir a DocuAI Agent

¡Gracias por tu interés en contribuir a DocuAI Agent! 🎉

## Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que lo respetes:

- Sé respetuoso y considerado
- Acepta críticas constructivas
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros

## ¿Cómo puedo contribuir?

### Reportar Bugs

Si encuentras un bug, crea un issue con:

1. **Título descriptivo**
2. **Pasos para reproducir** el problema
3. **Comportamiento esperado** vs **comportamiento actual**
4. **Screenshots** si es relevante
5. **Entorno**: OS, versión de Node, etc.

### Sugerir Mejoras

Para sugerencias de features:

1. **Describe el problema** que resuelve
2. **Propón una solución** detallada
3. **Considera alternativas** que hayas evaluado
4. **Contexto adicional**: mockups, ejemplos, etc.

### Pull Requests

#### Proceso

1. **Fork** el repositorio
2. **Crea una branch** desde `main`:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```
3. **Implementa** tu cambio
4. **Tests**: Asegúrate de que todos los tests pasen
5. **Lint**: Ejecuta `pnpm lint` y `pnpm type-check`
6. **Commit**: Usa [Conventional Commits](#conventional-commits)
7. **Push** a tu fork
8. **Abre un PR** contra `main`

#### Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) para mensajes de commit:

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional]

[footer opcional]
```

**Tipos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma, etc. (no afecta código)
- `refactor`: Refactorización (ni fix ni feature)
- `perf`: Mejora de performance
- `test`: Agregar o corregir tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**
```bash
feat(webhooks): add GitLab webhook signature validation

fix(docs-generator): prevent timeout for large files

docs(readme): update installation instructions

refactor(langchain): extract prompt templates to separate file
```

## Guías de Estilo

### TypeScript

- **Tipos explícitos**: Evita `any`, usa tipos específicos
- **Interfaces sobre types** para objetos públicos
- **Functional components** en React
- **Named exports** preferidos sobre default exports
- **JSDoc** para funciones públicas complejas

```typescript
// ✅ Bueno
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export function getUserById(id: string): Promise<User | null> {
  // ...
}

// ❌ Evitar
export default function (id: any) {
  // ...
}
```

### React

- **Functional components** con hooks
- **Props destructuring**
- **TypeScript interfaces** para props
- **Evitar prop drilling**: usa Context o estado global cuando sea necesario

```typescript
// ✅ Bueno
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={cn('btn', variant)}>
      {label}
    </button>
  );
}
```

### CSS / Tailwind

- Usa **Tailwind utility classes** siempre que sea posible
- Para casos complejos, extrae a componente
- Usa `cn()` helper para conditional classes
- Mobile-first approach

```tsx
// ✅ Bueno
<div className={cn(
  'flex items-center gap-2',
  isActive && 'bg-blue-500',
  'hover:bg-blue-600'
)}>
  ...
</div>
```

## Estructura de Archivos

Al agregar nuevos archivos, sigue esta estructura:

```
src/
├── app/                    # Next.js App Router
│   └── api/
│       └── webhooks/
│           └── github/
│               └── route.ts
├── components/
│   ├── ui/                # Componentes base (botones, inputs)
│   └── features/          # Componentes de features específicas
│       └── documentation/
│           └── DocumentViewer.tsx
├── lib/
│   └── langchain/        # Lógica de IA
│       ├── chains/
│       ├── prompts/
│       └── agents/
└── services/             # Servicios de negocio
    └── documentation/
        └── generator.ts
```

## Testing

### Tipos de Tests

1. **Unit tests**: Para funciones puras y utilidades
2. **Integration tests**: Para APIs y servicios
3. **E2E tests**: Para flujos críticos (webhook → docs)

### Cobertura

- Nuevas features deben tener tests
- Aim for >80% coverage en servicios críticos
- Bugs fixes deben incluir test de regresión

```typescript
// ejemplo: src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges classes correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });
});
```

## Documentación

Si tu PR introduce cambios significativos:

1. Actualiza el **README.md** si es necesario
2. Agrega/actualiza documentación en `docs/`
3. Actualiza **JSDoc** en funciones públicas
4. Considera agregar ejemplos de uso

## Revisión de Código

### Criterios de Aprobación

Tu PR será revisado considerando:

- ✅ **Funcionalidad**: Resuelve el problema correctamente
- ✅ **Calidad de código**: Legible, mantenible, bien estructurado
- ✅ **Tests**: Incluye tests apropiados y pasan
- ✅ **Performance**: No introduce regresiones de performance
- ✅ **Seguridad**: No introduce vulnerabilidades
- ✅ **Documentación**: Cambios están documentados

### Feedback

- Las revisiones buscan **mejorar el código**, no criticarte
- Discusiones son bienvenidas, pero sé **constructivo**
- Si no estás de acuerdo, **explica tu razonamiento**

## Preguntas

Si tienes dudas:

1. Revisa la [documentación](docs/)
2. Busca en [issues existentes](https://github.com/tu-usuario/docuai/issues)
3. Pregunta en [Discord](https://discord.gg/docuai)
4. Abre un [Discussion](https://github.com/tu-usuario/docuai/discussions)

## Reconocimientos

Los contribuidores serán reconocidos en:

- README.md (sección Contributors)
- Release notes
- Créditos en la app (contribuciones significativas)

¡Gracias por hacer que DocuAI sea mejor! 🚀
