import React, { useState } from 'react';
import { ToolPageLayout } from '../../components/ToolPageLayout';

interface AgeResults {
  summary: { years: number; months: number; days: number };
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthday: { months: number; days: number };
  zodiac: { western: string; chinese: string };
  birthDayOfWeek: string;
}

const getWesternZodiac = (day: number, month: number): string => {
    // month is 0-indexed, so we add 1
    const m = month + 1;
    if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries';
    if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus';
    if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini';
    if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer';
    if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo';
    if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo';
    if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra';
    if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio';
    if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius';
    if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Capricorn';
    if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius';
    if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return 'Pisces';
    return '';
};

const getChineseZodiac = (year: number): string => {
    const animals = ['Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat'];
    return animals[year % 12];
};

const AgeCalculator: React.FC = () => {
    const [birthDate, setBirthDate] = useState('');
    const [results, setResults] = useState<AgeResults | null>(null);

    const calculateAge = () => {
        if (!birthDate) return;
        const today = new Date();
        const birth = new Date(birthDate);

        // --- Age Summary (Years, Months, Days) ---
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const summary = { years, months, days };

        // --- Total Calculations ---
        const diffTime = today.getTime() - birth.getTime();
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
        const totalMinutes = Math.floor(diffTime / (1000 * 60));
        const totalMonths = summary.years * 12 + summary.months;

        // --- Next Birthday ---
        let nextBirthdayDate = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        if (nextBirthdayDate < today) {
            nextBirthdayDate.setFullYear(today.getFullYear() + 1);
        }
        
        let nextBdayMonths = nextBirthdayDate.getMonth() - today.getMonth();
        let nextBdayDays = nextBirthdayDate.getDate() - today.getDate();
        
        if (nextBdayDays < 0) {
            nextBdayMonths--;
            const prevMonthToday = new Date(today.getFullYear(), today.getMonth(), 0);
            nextBdayDays += prevMonthToday.getDate();
        }
        if (nextBdayMonths < 0) {
            nextBdayMonths += 12;
        }

        const nextBirthday = { months: nextBdayMonths, days: nextBdayDays };
        
        // --- Fun Facts ---
        const birthDayOfWeek = birth.toLocaleDateString('en-US', { weekday: 'long' });
        const zodiac = {
            western: getWesternZodiac(birth.getDate(), birth.getMonth()),
            chinese: getChineseZodiac(birth.getFullYear()),
        };

        setResults({
            summary,
            totalMonths,
            totalWeeks,
            totalDays,
            totalHours,
            totalMinutes,
            nextBirthday,
            zodiac,
            birthDayOfWeek,
        });
    };

    return (
        <ToolPageLayout
            title="Advanced Age Calculator"
            description="Find out your exact age and other interesting details."
        >
            <div className="flex flex-col items-center gap-4">
                <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="p-3 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary text-lg"
                    max={new Date().toISOString().split("T")[0]} // Prevent future dates
                />
                <button onClick={calculateAge} className="bg-brand-primary text-white px-8 py-3 rounded-md hover:bg-brand-primary-hover font-semibold text-lg">
                    Calculate Age
                </button>
            </div>

            {results && (
                <div className="mt-8 space-y-8 animate-fade-in-up">
                    {/* Summary */}
                    <div className="text-center bg-brand-bg p-6 rounded-lg shadow-inner">
                        <h2 className="text-xl font-semibold text-brand-text-secondary mb-2">You are</h2>
                        <p className="text-brand-primary">
                            <span className="text-4xl sm:text-5xl font-bold">{results.summary.years}</span><span className="text-2xl sm:text-3xl"> years, </span>
                            <span className="text-4xl sm:text-5xl font-bold">{results.summary.months}</span><span className="text-2xl sm:text-3xl"> months, and </span>
                            <span className="text-4xl sm:text-5xl font-bold">{results.summary.days}</span><span className="text-2xl sm:text-3xl"> days old</span>
                        </p>
                    </div>

                    {/* Detailed Breakdown */}
                    <div>
                        <h3 className="text-2xl font-bold text-center text-brand-text-primary mb-4">Age in other units</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <StatCard value={results.totalMonths.toLocaleString()} label="Total Months" />
                            <StatCard value={results.totalWeeks.toLocaleString()} label="Total Weeks" />
                            <StatCard value={results.totalDays.toLocaleString()} label="Total Days" />
                            <StatCard value={results.totalHours.toLocaleString()} label="Total Hours" />
                            <StatCard value={results.totalMinutes.toLocaleString()} label="Total Minutes" />
                        </div>
                    </div>
                    
                    {/* Fun Facts & Next Birthday */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-brand-bg p-6 rounded-lg shadow-inner space-y-4">
                             <h3 className="text-xl font-semibold text-brand-primary flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path><path d="M12 18a6 6 0 1 0 0-12"></path></svg>
                                Fun Facts
                             </h3>
                             <p>You were born on a <span className="font-semibold text-white">{results.birthDayOfWeek}</span>.</p>
                             <p>Your Western zodiac sign is <span className="font-semibold text-white">{results.zodiac.western}</span>.</p>
                             <p>Your Chinese zodiac sign is <span className="font-semibold text-white">{results.zodiac.chinese}</span>.</p>
                        </div>
                        <div className="bg-brand-bg p-6 rounded-lg shadow-inner">
                            <h3 className="text-xl font-semibold text-brand-primary flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                Next Birthday
                            </h3>
                            <p className="mt-4 text-3xl sm:text-4xl font-bold">
                                {results.nextBirthday.months} <span className="text-xl sm:text-2xl font-normal text-brand-text-secondary">months & </span> 
                                {results.nextBirthday.days} <span className="text-xl sm:text-2xl font-normal text-brand-text-secondary">days</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </ToolPageLayout>
    );
};

const StatCard: React.FC<{value: string, label: string}> = ({ value, label }) => (
    <div className="bg-brand-bg p-4 rounded-md text-center">
        <div className="text-3xl font-bold text-brand-primary">{value}</div>
        <div className="text-sm text-brand-text-secondary mt-1">{label}</div>
    </div>
);

export default AgeCalculator;