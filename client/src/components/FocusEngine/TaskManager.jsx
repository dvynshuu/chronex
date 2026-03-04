import React, { useState } from 'react';
import { useFocusContext } from './FocusContext';

const TaskManager = () => {
    const { state, dispatch } = useFocusContext();
    const { tasks, timer } = state;

    const [draft, setDraft] = useState({
        id: null,
        title: '',
        description: '',
        estimatedPomodoros: 1
    });

    const [dragState, setDragState] = useState({ sourceIndex: null });

    const resetDraft = () => {
        setDraft({
            id: null,
            title: '',
            description: '',
            estimatedPomodoros: 1
        });
    };

    const startEditing = (task) => {
        setDraft({
            id: task.id,
            title: task.title,
            description: task.description || '',
            estimatedPomodoros: task.estimatedPomodoros || 1
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!draft.title.trim()) return;

        if (draft.id) {
            dispatch({
                type: 'UPDATE_TASK',
                payload: {
                    id: draft.id,
                    updates: {
                        title: draft.title.trim(),
                        description: draft.description.trim() || undefined,
                        estimatedPomodoros: draft.estimatedPomodoros || 1
                    }
                }
            });
        } else {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            dispatch({
                type: 'ADD_TASK',
                payload: {
                    id,
                    title: draft.title.trim(),
                    description: draft.description.trim() || undefined,
                    estimatedPomodoros: draft.estimatedPomodoros || 1,
                    completedPomodoros: 0,
                    status: 'active'
                }
            });
        }

        resetDraft();
    };

    const handleDelete = (id) => {
        dispatch({ type: 'DELETE_TASK', payload: { id } });
    };

    const handleToggleDone = (task) => {
        dispatch({
            type: 'UPDATE_TASK',
            payload: {
                id: task.id,
                updates: {
                    status: task.status === 'done' ? 'active' : 'done'
                }
            }
        });
    };

    const handleSetActive = (task) => {
        dispatch({ type: 'SET_ACTIVE_TASK', payload: { taskId: task.id } });
    };

    const handleClearActive = () => {
        dispatch({ type: 'SET_ACTIVE_TASK', payload: { taskId: null } });
    };

    const onDragStart = (index, e) => {
        setDragState({ sourceIndex: index });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (index) => {
        if (dragState.sourceIndex == null) return;
        dispatch({
            type: 'REORDER_TASKS',
            payload: {
                sourceIndex: dragState.sourceIndex,
                destIndex: index
            }
        });
        setDragState({ sourceIndex: null });
    };

    const activeTaskId = timer.activeTaskId;

    return (
        <div className="ce-panel ce-tasks-panel">
            <div className="ce-panel-header">
                <div>
                    <h3 className="ce-panel-title">Focus queue</h3>
                    <p className="ce-panel-subtitle">
                        Linear-grade tasks, synchronized with your sessions.
                    </p>
                </div>
            </div>

            <form className="ce-task-form" onSubmit={handleSubmit}>
                <div className="ce-task-form-main">
                    <input
                        className="ce-input"
                        placeholder="Add a task for this deep work block"
                        value={draft.title}
                        onChange={(e) =>
                            setDraft((d) => ({
                                ...d,
                                title: e.target.value
                            }))
                        }
                    />
                    <input
                        className="ce-input ce-input-inline"
                        placeholder="Description (optional)"
                        value={draft.description}
                        onChange={(e) =>
                            setDraft((d) => ({
                                ...d,
                                description: e.target.value
                            }))
                        }
                    />
                </div>
                <div className="ce-task-form-footer">
                    <label className="ce-small-label">
                        Est. pomodoros
                        <input
                            type="number"
                            min={1}
                            max={24}
                            value={draft.estimatedPomodoros}
                            onChange={(e) =>
                                setDraft((d) => ({
                                    ...d,
                                    estimatedPomodoros: Number(e.target.value) || 1
                                }))
                            }
                        />
                    </label>
                    <div className="ce-task-form-actions">
                        {draft.id && (
                            <button
                                type="button"
                                className="ce-ghost-btn ce-ghost-btn-sm"
                                onClick={resetDraft}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="ce-primary-btn ce-primary-btn-sm"
                            disabled={!draft.title.trim()}
                        >
                            {draft.id ? 'Save' : 'Add'}
                        </button>
                    </div>
                </div>
            </form>

            <div className="ce-task-list">
                {tasks.length === 0 ? (
                    <div className="ce-empty-state">
                        No tasks yet. Capture the work this session is for.
                    </div>
                ) : (
                    tasks.map((task, index) => {
                        const isActive = task.id === activeTaskId;
                        const progressRatio = task.estimatedPomodoros
                            ? Math.min(
                                  1,
                                  task.completedPomodoros /
                                      Math.max(1, task.estimatedPomodoros)
                              )
                            : 0;
                        const isDragging = dragState.sourceIndex === index;

                        return (
                            <div
                                key={task.id}
                                className={`ce-task-row ${
                                    task.status === 'done' ? 'is-done' : ''
                                } ${isActive ? 'is-linked' : ''} ${
                                    isDragging ? 'is-dragging' : ''
                                }`}
                                draggable
                                onDragStart={(e) => onDragStart(index, e)}
                                onDragOver={onDragOver}
                                onDrop={() => onDrop(index)}
                            >
                                <div className="ce-task-left">
                                    <button
                                        type="button"
                                        className="ce-checkbox"
                                        onClick={() => handleToggleDone(task)}
                                        aria-label={
                                            task.status === 'done'
                                                ? 'Mark as active'
                                                : 'Mark done'
                                        }
                                    >
                                        <span />
                                    </button>
                                    <div className="ce-task-main">
                                        <div className="ce-task-title-line">
                                            <span className="ce-task-title">
                                                {task.title}
                                            </span>
                                            {task.description && (
                                                <span className="ce-task-desc">
                                                    {task.description}
                                                </span>
                                            )}
                                        </div>
                                        <div className="ce-task-meta">
                                            <span className="ce-task-meta-item">
                                                {task.completedPomodoros} /{' '}
                                                {task.estimatedPomodoros || '∞'} pomodoros
                                            </span>
                                            <div className="ce-task-meta-progress">
                                                <div className="ce-task-meta-bar">
                                                <div
                                                    className="ce-task-meta-bar-fill"
                                                    style={{
                                                        width: `${progressRatio * 100}%`
                                                    }}
                                                />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ce-task-actions">
                                    <button
                                        type="button"
                                        className="ce-ghost-btn ce-ghost-btn-sm"
                                        onClick={() =>
                                            isActive
                                                ? handleClearActive()
                                                : handleSetActive(task)
                                        }
                                    >
                                        {isActive ? 'Unlink' : 'Link'}
                                    </button>
                                    <button
                                        type="button"
                                        className="ce-ghost-btn ce-ghost-btn-sm"
                                        onClick={() => startEditing(task)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="ce-ghost-btn ce-ghost-btn-sm"
                                        onClick={() => handleDelete(task.id)}
                                    >
                                        Delete
                                    </button>
                                    <span className="ce-drag-handle" aria-hidden="true">
                                        ⋮⋮
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TaskManager;

