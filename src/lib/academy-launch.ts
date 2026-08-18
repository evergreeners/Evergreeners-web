export const ACADEMY_LAUNCH_DATE = "2026-08-31T00:00:00Z";

export const ACADEMY_LAUNCH_DATE_LABEL = new Date(ACADEMY_LAUNCH_DATE).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
});

export function isAcademyLaunchOpen(): boolean {
    return Date.now() >= +new Date(ACADEMY_LAUNCH_DATE);
}

export interface AcademyTimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function getAcademyTimeLeft(): AcademyTimeLeft {
    const difference = +new Date(ACADEMY_LAUNCH_DATE) - +new Date();
    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}