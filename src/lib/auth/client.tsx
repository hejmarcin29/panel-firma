'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentSession } from './session';

type User = {
    id: string;
    name: string | null;
    email: string;
    roles: string[];
};

const UserContext = createContext<{ user: User | null; isLoading: boolean }>({
    user: null,
    isLoading: true,
});

export function UserProvider({ children, initialUser }: { children: React.ReactNode; initialUser: User | null }) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    return (
        <UserContext.Provider value={{ user, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
