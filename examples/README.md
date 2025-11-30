# 🧶 Braided React Examples

Three complete examples demonstrating different patterns for integrating Braided systems with React.

## Examples

### 1. [Basic](./basic/) - Pre-Started System ⭐ **Start Here**

The recommended pattern: start the system before React mounts.

```bash
cd basic
npm install
npm run dev
```

**Shows:**

- System started before React
- Full type inference
- StrictMode compatibility
- Clean separation of concerns

**Best for:** Production apps, full lifecycle control

---

### 2. [Singleton Manager](./singleton-manager/) - Lazy Initialization

Module-level singleton pattern with lazy initialization.

```bash
cd singleton-manager
npm install
npm run dev
```

**Shows:**

- Role-based systems (host vs player)
- Lazy system startup
- System persistence across navigation
- Explicit cleanup control

**Best for:** Multi-role apps, navigation persistence

---

### 3. [Lazy Start](./lazy-start/) - React-Triggered Start

System starts when component mounts, with loading states.

```bash
cd lazy-start
npm install
npm run dev
```

**Shows:**

- React-triggered startup
- Loading states and fallbacks
- Async resource initialization
- Error handling callbacks

**Best for:** Route-based loading, progressive enhancement

---

## Which Pattern Should I Use?

| If you want to...                 | Use This Pattern      |
| --------------------------------- | --------------------- |
| Start system before React         | **Basic** ⭐          |
| Full control over lifecycle       | **Basic** ⭐          |
| Production-ready setup            | **Basic** ⭐          |
| Role-based systems (host/player)  | **Singleton Manager** |
| System persists across navigation | **Singleton Manager** |
| Lazy initialization               | **Singleton Manager** |
| React triggers system start       | **Lazy Start**        |
| Route-based lazy loading          | **Lazy Start**        |
| Built-in loading states           | **Lazy Start**        |

## Common Patterns

All examples follow these principles:

1. **System lives outside React** - React observes, doesn't control
2. **Type-safe hooks** - Full inference from config to components
3. **No ref counting** - System doesn't care about React's mount/unmount
4. **Explicit cleanup** - Halt system when truly done, not on unmount

## Running All Examples

From the repo root:

```bash
# Install dependencies for all examples
npm install

# Run specific example
cd examples/basic && npm install && npm run dev
cd examples/singleton-manager && npm install && npm run dev
cd examples/lazy-start && npm install && npm run dev
```

## Learning Path

1. **Day 1:** Run [Basic](./basic/) - understand the core pattern
2. **Day 2:** Run [Singleton Manager](./singleton-manager/) - see lazy initialization
3. **Day 3:** Run [Lazy Start](./lazy-start/) - explore React-triggered starts
4. **Day 4:** Build your own! Mix and match patterns as needed

## Tips

- Open DevTools console to see system lifecycle logs
- Try React DevTools to see how systems are just context
- Experiment with StrictMode - systems survive double-mounting
- Check the README in each example for specific details

---

**Untangle your code. Compose your systems. Let React observe.** 🧶

[Main Docs](../README.md) • [npm](https://www.npmjs.com/package/braided-react) • [GitHub](https://github.com/RegiByte/braided-react)
