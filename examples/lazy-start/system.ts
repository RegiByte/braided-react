/**
 * System Configuration - Zustand Integration
 *
 * This example shows how to manage Zustand stores as Braided resources.
 * The stores live in the system, providing a centralized place for all state.
 */

import { defineResource } from "braided";
import { create } from "zustand";

/**
 * Counter Store Resource
 *
 * A Zustand store managed as a Braided resource.
 * The store persists across React remounts.
 */
export const counterStoreResource = defineResource({
  start: () => {
    console.log("🔢 Counter store starting...");

    // Create a Zustand store
    const useCounterStore = create<{
      count: number;
      increment: () => void;
      decrement: () => void;
      reset: () => void;
    }>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      reset: () => set({ count: 0 }),
    }));

    return { useCounterStore };
  },
  halt: (store) => {
    const state = store.useCounterStore.getState();
    console.log(`🔢 Counter store halting (final count: ${state.count})`);
  },
});

/**
 * Todo Store Resource
 *
 * Another Zustand store for managing todos.
 * Demonstrates multiple stores in one system.
 */
export const todoStoreResource = defineResource({
  start: () => {
    console.log("📝 Todo store starting...");

    type Todo = {
      id: string;
      text: string;
      completed: boolean;
    };

    const useTodoStore = create<{
      todos: Todo[];
      addTodo: (text: string) => void;
      toggleTodo: (id: string) => void;
      removeTodo: (id: string) => void;
      clearCompleted: () => void;
    }>((set) => ({
      todos: [],
      addTodo: (text) =>
        set((state) => ({
          todos: [
            ...state.todos,
            { id: Date.now().toString(), text, completed: false },
          ],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),
      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        })),
    }));

    return { useTodoStore };
  },
  halt: (store) => {
    const state = store.useTodoStore.getState();
    console.log(`📝 Todo store halting (${state.todos.length} todos)`);
  },
});

/**
 * Logger Resource - Depends on stores
 *
 * Demonstrates a resource that observes Zustand stores.
 * Can log actions or react to state changes.
 */
export const loggerResource = defineResource({
  dependencies: ["counterStore", "todoStore"],
  start: ({ counterStore, todoStore }) => {
    console.log("📊 Logger starting...");

    // Subscribe to counter changes
    const unsubCounter = counterStore.useCounterStore.subscribe((state) => {
      console.log(`📊 Counter changed: ${state.count}`);
    });

    // Subscribe to todo changes
    const unsubTodo = todoStore.useTodoStore.subscribe((state) => {
      console.log(`📊 Todos changed: ${state.todos.length} total`);
    });

    return {
      logCurrentState: () => {
        const counterState = counterStore.useCounterStore.getState();
        const todoState = todoStore.useTodoStore.getState();
        console.log("📊 Current State:", {
          count: counterState.count,
          todos: todoState.todos.length,
        });
      },
      cleanup: () => {
        unsubCounter();
        unsubTodo();
      },
    };
  },
  halt: (logger) => {
    logger.cleanup();
    console.log("📊 Logger halting");
  },
});

/**
 * System Configuration
 */
export const systemConfig = {
  counterStore: counterStoreResource,
  todoStore: todoStoreResource,
  logger: loggerResource,
};
