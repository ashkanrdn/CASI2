import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllContentSections } from '@/lib/content';

/**
 * Content section interface matching the existing structure
 */
export interface ContentSection {
    title: string;
    subtitle?: string;
    order: number;
    visible: boolean;
    section: string;
    content: string;
    frontmatter: Record<string, any>;
}

/**
 * Content loading status
 */
export type ContentStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Content state interface
 */
export interface ContentState {
    // Content sections by section name for easy lookup
    contentSections: Record<string, ContentSection>;
    
    // Loading status
    status: ContentStatus;
    error: string | null;
    
    // Timestamps for cache management
    loadedAt: number | null;
    
    // Ordered list of all sections
    orderedSections: string[];
}

/**
 * Initial state
 */
const initialState: ContentState = {
    contentSections: {},
    status: 'idle',
    error: null,
    loadedAt: null,
    orderedSections: [],
};

/**
 * Async thunk for loading all content sections
 */
export const loadAllContentSections = createAsyncThunk(
    'content/loadAllContentSections',
    async (_, { rejectWithValue }) => {
        try {
            console.log('📄 [ContentSlice] Loading all content sections...');
            const startTime = Date.now();
            
            const sections = await getAllContentSections();
            
            const loadTime = Date.now() - startTime;
            console.log(`✅ [ContentSlice] Loaded ${sections.length} content sections in ${loadTime}ms`);
            
            return sections;
        } catch (error) {
            const errorMessage = `Failed to load content sections: ${error}`;
            console.error('❌ [ContentSlice]', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

/**
 * Content slice
 */
export const contentSlice = createSlice({
    name: 'content',
    initialState,
    reducers: {
        /**
         * Clear content error
         */
        clearContentError: (state) => {
            state.error = null;
        },
        
        /**
         * Reset content to initial state
         */
        resetContent: () => initialState,
        
        /**
         * Update a specific content section
         */
        updateContentSection: (state, action: PayloadAction<ContentSection>) => {
            const section = action.payload;
            state.contentSections[section.section] = section;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadAllContentSections.pending, (state) => {
                state.status = 'loading';
                state.error = null;
                console.log('📄 [ContentSlice] Content loading started...');
            })
            .addCase(loadAllContentSections.fulfilled, (state, action: PayloadAction<ContentSection[]>) => {
                state.status = 'succeeded';
                state.loadedAt = Date.now();
                state.error = null;
                
                // Clear existing content
                state.contentSections = {};
                state.orderedSections = [];
                
                // Store sections by section name for easy lookup
                action.payload.forEach(section => {
                    state.contentSections[section.section] = section;
                    state.orderedSections.push(section.section);
                });
                
                // Keep sections ordered
                state.orderedSections.sort((a, b) => 
                    state.contentSections[a].order - state.contentSections[b].order
                );
                
                console.log(`✅ [ContentSlice] Content sections stored in state:`, 
                    Object.keys(state.contentSections));
            })
            .addCase(loadAllContentSections.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string || 'Unknown error occurred while loading content';
                state.loadedAt = null;
                
                console.error('❌ [ContentSlice] Content loading failed:', state.error);
            });
    },
});

export const {
    clearContentError,
    resetContent,
    updateContentSection,
} = contentSlice.actions;

export default contentSlice.reducer;