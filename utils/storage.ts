import { Project, Comment } from '../types';
import { MOCK_PROJECTS, MOCK_COMMENTS } from '../constants';

const DB_NAME = '3dverse-db';
const DB_VERSION = 2; // Bumped version for new stores
const STORE_PROJECTS = 'projects';
const STORE_FILES = 'files';
const STORE_COMMENTS = 'comments';

// Initialize DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Projects Store
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }

      // Files Store (Binary blobs)
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES); 
      }

      // Comments Store
      if (!db.objectStoreNames.contains(STORE_COMMENTS)) {
        const commentStore = db.createObjectStore(STORE_COMMENTS, { keyPath: 'id' });
        commentStore.createIndex('projectId', 'projectId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- Projects API ---

export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.getAll();

      request.onsuccess = async () => {
        let projects = request.result;
        // Seed if empty
        if (projects.length === 0) {
           projects = await seedMockProjects();
        }
        resolve(projects.sort((a,b) => b.id.localeCompare(a.id)));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("DB Error", e);
    return MOCK_PROJECTS;
  }
};

const seedMockProjects = async (): Promise<Project[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_PROJECTS, 'readwrite');
  const store = tx.objectStore(STORE_PROJECTS);
  
  MOCK_PROJECTS.forEach(p => store.put(p));
  
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(MOCK_PROJECTS);
  });
};

export const saveProject = async (project: Project): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    store.put(project);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const updateProjectThumbnail = async (projectId: string, dataUrl: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_PROJECTS, 'readwrite');
  const store = tx.objectStore(STORE_PROJECTS);
  
  const getReq = store.get(projectId);
  
  getReq.onsuccess = () => {
    const project = getReq.result;
    if (project) {
      project.thumbnail = dataUrl;
      store.put(project);
    }
  };
};

// --- Comments API ---

export const getComments = async (projectId: string): Promise<Comment[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COMMENTS, 'readonly');
    const store = tx.objectStore(STORE_COMMENTS);
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    request.onsuccess = async () => {
      let comments = request.result;
      
      // If DB is empty for this project and it's one of the demo projects, seed mock comments
      // Note: In a real app we wouldn't auto-seed on read, but good for demo continuity
      if (comments.length === 0 && (projectId === 'p1' || projectId === 'p2' || projectId === 'p3')) {
         comments = await seedMockComments(projectId);
      }
      
      // Sort by creation time (descending)
      resolve(comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    request.onerror = () => reject(request.error);
  });
};

const seedMockComments = async (projectId: string): Promise<Comment[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_COMMENTS, 'readwrite');
  const store = tx.objectStore(STORE_COMMENTS);
  
  const commentsToSeed = MOCK_COMMENTS.map(c => ({...c, projectId}));
  
  commentsToSeed.forEach(c => store.put(c));
  
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(commentsToSeed);
  });
};

export const saveComment = async (comment: Comment): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COMMENTS, 'readwrite');
    const store = tx.objectStore(STORE_COMMENTS);
    store.put(comment);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const updateComment = async (comment: Comment): Promise<void> => {
  // Same as save, put overwrites
  return saveComment(comment);
};

// --- Files API ---

export const saveFile = async (projectId: string, file: File): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_FILES, 'readwrite');
  const store = tx.objectStore(STORE_FILES);
  store.put(file, projectId);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getFile = async (projectId: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);
    const request = store.get(projectId);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const rehydrateProjectUrls = async (projects: Project[]): Promise<Project[]> => {
  const updatedProjects = await Promise.all(projects.map(async (p) => {
    if (p.fileUrl && p.fileUrl.startsWith('blob:')) {
      const blob = await getFile(p.id);
      if (blob) {
        return { ...p, fileUrl: URL.createObjectURL(blob) };
      }
    }
    const blob = await getFile(p.id);
    if (blob) {
        return { ...p, fileUrl: URL.createObjectURL(blob) };
    }
    return p;
  }));
  return updatedProjects;
};
