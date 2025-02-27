// src/utils/colorUtils.js

// 사용자별 색상 설정
const userColors = {
    '승혜': '#FF5722',  // pizza
    'pizza@test.com': '#FF5722',  // 이메일로도 매핑
    '가연': '#2196F3',  // 1bfish106
    '1bfish106@test.com': '#2196F3',  // 이메일로도 매핑
    '석린': '#4CAF50',  // hosk2014
    'hosk2014@test.com': '#4CAF50'  // 이메일로도 매핑
};

// 기본 색상
const defaultColor = '#9C27B0';

/**
 * 사용자 이름 또는 이메일에 기반한 색상을 반환하는 함수
 * @param {string} username - 사용자 이름 또는 이메일
 * @returns {string} - 색상 코드
 */
export const getUserColor = (username) => {
    console.log('색상 매핑 중:', username);

    if (!username) {
        return defaultColor;
    }

    // 직접 매핑 먼저 시도
    if (userColors[username]) {
        return userColors[username];
    }

    // 이름이 포함된 키 찾기 (부분 매칭)
    const partialMatch = Object.keys(userColors).find(key =>
        username.includes(key) || key.includes(username)
    );

    if (partialMatch) {
        return userColors[partialMatch];
    }

    // 이메일 패턴 매칭 (예: "이름 <이메일>" 형식)
    if (username.includes('@')) {
        const emailPart = username.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emailPart && emailPart[0]) {
            const email = emailPart[0];
            if (userColors[email]) {
                return userColors[email];
            }

            // 이메일의 @ 앞부분을 기준으로 매칭 시도
            const emailPrefix = email.split('@')[0];
            for (const key in userColors) {
                if (key.includes(emailPrefix) || emailPrefix.includes(key)) {
                    return userColors[key];
                }
            }
        }
    }

    // 기본 색상 반환 (사용자별로 다른 기본 색상)
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const defaultColors = ['#9C27B0', '#673AB7', '#3F51B5', '#F44336', '#E91E63'];
    return defaultColors[hash % defaultColors.length];
};

export default { getUserColor };
