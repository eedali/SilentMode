import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ContentProps {
    title: string;
    description: string;
    type: 'text' | 'image' | 'video';
}

const ContentCard: React.FC<ContentProps> = ({ title, description, type }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <Text style={styles.type}>Type: {type}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        marginBottom: 4,
    },
    type: {
        fontSize: 12,
        color: 'gray',
    },
});

export default ContentCard;
