import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { ToolPageLayout } from '../../components/ToolPageLayout';

interface Course {
    id: number;
    name: string;
    grade: string;
    credits: string;
}

interface Semester {
    id: number;
    name: string;
    courses: Course[];
}

type GradeScale = { [key: string]: number };

interface GpaData {
    semesters: Semester[];
    gradeScale: GradeScale;
}

const defaultGradePoints: GradeScale = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 };

const defaultData: GpaData = {
    semesters: [{ id: 1, name: 'First Semester', courses: [{ id: 1, name: 'Example Course', grade: 'A', credits: '3' }] }],
    gradeScale: defaultGradePoints,
};

const calculateGpaForCourses = (courses: Course[], gradeScale: GradeScale): { gpa: string, totalCredits: number, totalPoints: number } => {
    let totalPoints = 0;
    let totalCredits = 0;
    for (const course of courses) {
        const credits = parseFloat(course.credits);
        const points = gradeScale[course.grade];
        if (!isNaN(credits) && credits > 0 && points !== undefined) {
            totalPoints += points * credits;
            totalCredits += credits;
        }
    }
    if (totalCredits === 0) {
        return { gpa: 'N/A', totalCredits: 0, totalPoints: 0 };
    }
    return { gpa: (totalPoints / totalCredits).toFixed(2), totalCredits, totalPoints };
};

const GpaCalculator: React.FC = () => {
    const [gpaData, setGpaData] = useLocalStorage<GpaData>('gpa-data-v2', defaultData);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Projection State
    const [targetGpa, setTargetGpa] = useState('');
    const [futureCredits, setFutureCredits] = useState('');
    const [projectionResult, setProjectionResult] = useState<string | null>(null);

    const { gpa: cumulativeGpa, totalCredits: currentCredits, totalPoints: currentPoints } = useMemo(() => {
        const allCourses = gpaData.semesters.flatMap(s => s.courses);
        return calculateGpaForCourses(allCourses, gpaData.gradeScale);
    }, [gpaData]);

    const calculateProjection = () => {
        const target = parseFloat(targetGpa);
        const future = parseFloat(futureCredits);
        if (isNaN(target) || isNaN(future) || future <= 0) {
            setProjectionResult('Please enter valid numbers for target GPA and future credits.');
            return;
        }
        
        const totalCreditsNeeded = currentCredits + future;
        const totalPointsNeeded = target * totalCreditsNeeded;
        const futurePointsNeeded = totalPointsNeeded - currentPoints;
        const requiredGpa = futurePointsNeeded / future;
        
        const maxPossibleGrade = Math.max(...Object.values(gpaData.gradeScale));

        if (requiredGpa > maxPossibleGrade) {
            setProjectionResult(`It's impossible to reach your target. You would need a GPA of ${requiredGpa.toFixed(2)}, but the maximum is ${maxPossibleGrade.toFixed(2)}.`);
        } else if (requiredGpa < 0) {
            setProjectionResult(`You've already surpassed your target GPA!`);
        } else {
            setProjectionResult(`You need to average a ${requiredGpa.toFixed(2)} GPA over the next ${future} credits to reach your goal of ${target.toFixed(2)}.`);
        }
    };

    const updateSemesters = (semesters: Semester[]) => {
        setGpaData(prev => ({...prev, semesters}));
    };
    
    const updateGradeScale = (gradeScale: GradeScale) => {
        setGpaData(prev => ({...prev, gradeScale}));
    };

    const addSemester = () => {
        const newSemesterName = `Semester ${gpaData.semesters.length + 1}`;
        updateSemesters([...gpaData.semesters, { id: Date.now(), name: newSemesterName, courses: [] }]);
    };
    
    const updateSemesterName = (id: number, name: string) => {
        updateSemesters(gpaData.semesters.map(s => s.id === id ? { ...s, name } : s));
    };
    
    const removeSemester = (id: number) => {
        updateSemesters(gpaData.semesters.filter(s => s.id !== id));
    };

    const addCourse = (semesterId: number) => {
        updateSemesters(gpaData.semesters.map(s => s.id === semesterId ? { ...s, courses: [...s.courses, { id: Date.now(), name: '', grade: 'A', credits: '3' }] } : s));
    };
    
    const updateCourse = (semesterId: number, courseId: number, field: keyof Omit<Course, 'id'>, value: string) => {
        updateSemesters(gpaData.semesters.map(s => s.id === semesterId ? { ...s, courses: s.courses.map(c => c.id === courseId ? {...c, [field]: value} : c) } : s));
    };
    
    const removeCourse = (semesterId: number, courseId: number) => {
        updateSemesters(gpaData.semesters.map(s => s.id === semesterId ? { ...s, courses: s.courses.filter(c => c.id !== courseId) } : s));
    };

    return (
        <ToolPageLayout
            title="Advanced GPA Calculator"
            description="Track your GPA, set goals, and customize your grade scale. Data is saved automatically."
        >
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-brand-bg p-4 rounded-lg text-center">
                        <div className="flex justify-center items-center gap-2">
                           <p className="text-brand-text-secondary">Cumulative GPA</p>
                           <button onClick={() => setIsSettingsOpen(true)} className="text-brand-text-secondary hover:text-brand-primary" title="Grade Scale Settings">
                               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                           </button>
                        </div>
                        <p className="text-5xl font-bold text-brand-primary">{cumulativeGpa}</p>
                    </div>

                    <div className="bg-brand-bg p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-center mb-2">GPA Projection</h3>
                        <div className="flex items-center gap-2">
                            <input type="number" value={targetGpa} onChange={e => setTargetGpa(e.target.value)} placeholder="Target GPA" className="w-1/2 p-2 bg-brand-surface border border-brand-border rounded" />
                            <input type="number" value={futureCredits} onChange={e => setFutureCredits(e.target.value)} placeholder="Future Credits" className="w-1/2 p-2 bg-brand-surface border border-brand-border rounded" />
                            <button onClick={calculateProjection} className="bg-brand-primary px-3 py-2 rounded">Go</button>
                        </div>
                        {projectionResult && <p className="text-xs text-center text-brand-text-secondary mt-2">{projectionResult}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    {gpaData.semesters.map(semester => (
                        <div key={semester.id} className="bg-brand-bg p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <input type="text" value={semester.name} onChange={(e) => updateSemesterName(semester.id, e.target.value)} className="font-bold text-xl bg-transparent border-b border-brand-border focus:border-brand-primary outline-none"/>
                                <div>
                                    <span className="font-semibold text-brand-text-secondary mr-2">Semester GPA: {calculateGpaForCourses(semester.courses, gpaData.gradeScale).gpa}</span>
                                    <button onClick={() => removeSemester(semester.id)} className="text-red-500 hover:text-red-400 font-bold">✕</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {semester.courses.map(course => (
                                    <div key={course.id} className="grid grid-cols-12 gap-2 items-center">
                                        <input type="text" value={course.name} onChange={e => updateCourse(semester.id, course.id, 'name', e.target.value)} placeholder="Course Name" className="col-span-6 p-2 bg-brand-surface border border-brand-border rounded-md" />
                                        <select value={course.grade} onChange={e => updateCourse(semester.id, course.id, 'grade', e.target.value)} className="col-span-3 p-2 bg-brand-surface border border-brand-border rounded-md">
                                            {Object.keys(gpaData.gradeScale).map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <input type="number" value={course.credits} onChange={e => updateCourse(semester.id, course.id, 'credits', e.target.value)} placeholder="Credits" className="col-span-2 p-2 bg-brand-surface border border-brand-border rounded-md" />
                                        <button onClick={() => removeCourse(semester.id, course.id)} className="col-span-1 text-red-500 hover:text-red-400 font-bold text-center">✕</button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addCourse(semester.id)} className="text-brand-primary mt-3">+ Add Course</button>
                        </div>
                    ))}
                </div>
                <button onClick={addSemester} className="w-full bg-brand-primary/20 text-brand-primary border border-brand-primary py-2 rounded-md hover:bg-brand-primary/30 font-semibold">
                    + Add New Semester
                </button>
            </div>
            {isSettingsOpen && <GradeScaleModal gradeScale={gpaData.gradeScale} onSave={updateGradeScale} onClose={() => setIsSettingsOpen(false)} />}
        </ToolPageLayout>
    );
};

const GradeScaleModal: React.FC<{ gradeScale: GradeScale, onSave: (newScale: GradeScale) => void, onClose: () => void }> = ({ gradeScale, onSave, onClose }) => {
    const [localGradeScale, setLocalGradeScale] = useState(gradeScale);
    
    const handleSave = () => {
        onSave(localGradeScale);
        onClose();
    };
    
    const handleReset = () => {
        setLocalGradeScale(defaultGradePoints);
    };

    const updateValue = (grade: string, value: string) => {
        const numValue = parseFloat(value);
        setLocalGradeScale(prev => ({...prev, [grade]: isNaN(numValue) ? 0 : numValue}));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Grade Scale Settings</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {Object.entries(localGradeScale).map(([grade, value]) => (
                        <div key={grade} className="flex items-center gap-4">
                            <span className="font-bold w-12">{grade}</span>
                            <input type="number" step="0.1" value={value} onChange={e => updateValue(grade, e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={handleReset} className="bg-brand-border px-4 py-2 rounded-md">Reset to Default</button>
                    <button onClick={onClose} className="bg-brand-border px-4 py-2 rounded-md">Cancel</button>
                    <button onClick={handleSave} className="bg-brand-primary px-4 py-2 rounded-md">Save</button>
                </div>
            </div>
        </div>
    );
};

export default GpaCalculator;
