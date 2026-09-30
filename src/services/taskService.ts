import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Task, TaskCategory } from '../types/task';

const LOCAL_STORAGE_KEY = 'synctasks_guest_items_v1';

export function getLocalTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return getDefaultSampleTasks();
    return JSON.parse(raw);
  } catch {
    return getDefaultSampleTasks();
  }
}

export function saveLocalTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

function getDefaultSampleTasks(): Task[] {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'sample-1',
      userId: 'guest',
      title: 'Review quarterly project deliverables',
      description: 'Prepare final notes for team sync and verify action items.',
      category: 'EX',
      dueDate: today,
      hasTime: true,
      dueTime: '15:30',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      userId: 'guest',
      title: 'Quarterly alignment meeting with stakeholders',
      description: 'Sync on cross-device rollout schedule and user feedback.',
      category: 'ME',
      dueDate: today,
      hasTime: true,
      dueTime: '11:00',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-3',
      userId: 'guest',
      title: 'Back up workspace notes & archive old logs',
      description: 'Standard hygiene check for digital workspace assets.',
      category: 'NC',
      dueDate: tomorrow,
      hasTime: false,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function subscribeUserTasks(
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/tasks`;
  const tasksRef = collection(db, 'users', userId, 'tasks');

  const unsubscribe = onSnapshot(
    tasksRef,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Task;
        tasks.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort tasks by completed status, then by due date and time
      tasks.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        const dateA = `${a.dueDate} ${a.hasTime && a.dueTime ? a.dueTime : '23:59'}`;
        const dateB = `${b.dueDate} ${b.hasTime && b.dueTime ? b.dueTime : '23:59'}`;
        return dateA.localeCompare(dateB);
      });
      onUpdate(tasks);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        if (onError && e instanceof Error) {
          onError(e);
        }
      }
    }
  );

  return unsubscribe;
}

export async function createCloudTask(
  userId: string,
  taskInput: {
    title: string;
    description?: string;
    category: TaskCategory;
    dueDate: string;
    hasTime: boolean;
    dueTime?: string;
  }
): Promise<Task> {
  const taskId = 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();
  const path = `users/${userId}/tasks/${taskId}`;

  const newTask: Task = {
    id: taskId,
    userId,
    title: taskInput.title.trim(),
    description: taskInput.description?.trim() || '',
    category: taskInput.category,
    dueDate: taskInput.dueDate,
    hasTime: taskInput.hasTime,
    dueTime: taskInput.hasTime && taskInput.dueTime ? taskInput.dueTime : '',
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'tasks', taskId);
    await setDoc(docRef, newTask);
    return newTask;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudTask(
  userId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  const now = new Date().toISOString();

  try {
    const docRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudTask(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function migrateLocalTasksToCloud(userId: string): Promise<number> {
  const local = getLocalTasks();
  if (!local.length) return 0;

  let count = 0;
  try {
    const collectionPath = `users/${userId}/tasks`;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const existingSnap = await getDocs(tasksRef);
    const existingCount = existingSnap.size;

    // Only migrate if user account has 0 or fewer tasks, or migrate new guest ones
    if (existingCount === 0) {
      for (const t of local) {
        await createCloudTask(userId, {
          title: t.title,
          description: t.description,
          category: t.category,
          dueDate: t.dueDate,
          hasTime: t.hasTime,
          dueTime: t.dueTime,
        });
        count++;
      }
    }
    // Clear guest local items after sync
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('Migration error:', error);
  }
  return count;
}
