import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const api = axios.create({
    baseURL: BASE_URL,
});

export const getContents = async () => {
    try {
        const response = await api.get('/contents');
        return response.data;
    } catch (error) {
        console.error('Error fetching contents:', error);
        return [];
    }
};
