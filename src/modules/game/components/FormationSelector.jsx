import React from 'react';
import { Select, Form, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const FormationSelector = ({ formationA, formationB, onFormationChange, isOrganizer, gameFormat = '5x5' }) => {
    const { t } = useTranslation();
    const formations = {
        '5x5': [
            { value: '2-2', label: t('game.formation.classic') },
            { value: '1-2-1', label: t('game.formation.diamond') },
            { value: '3-1', label: t('game.formation.defense') },
            { value: '1-3', label: t('game.formation.attack') }
        ],
        '6x6': [
            { value: '2-2-1', label: '2-2-1' },
            { value: '3-2', label: '3-2' },
            { value: '2-3', label: '2-3' },
            { value: '1-3-1', label: '1-3-1' }
        ],
        '7x7': [
            { value: '2-3-1', label: '2-3-1' },
            { value: '3-2-1', label: '3-2-1' },
            { value: '2-2-2', label: '2-2-2' },
            { value: '3-3', label: '3-3' }
        ],
        '8x8': [
            { value: '3-3-1', label: '3-3-1' },
            { value: '2-4-1', label: '2-4-1' },
            { value: '3-2-2', label: '3-2-2' },
            { value: '2-3-2', label: '2-3-2' }
        ],
        '9x9': [
            { value: '3-3-2', label: '3-3-2' },
            { value: '3-4-1', label: '3-4-1' },
            { value: '4-3-1', label: '4-3-1' },
            { value: '2-4-2', label: '2-4-2' }
        ],
        '10x10': [
            { value: '4-3-2', label: '4-3-2' },
            { value: '4-4-1', label: '4-4-1' },
            { value: '3-4-2', label: '3-4-2' },
            { value: '3-5-1', label: '3-5-1' }
        ],
        '11x11': [
            { value: '4-4-2', label: '4-4-2' },
            { value: '4-3-3', label: '4-3-3' },
            { value: '3-5-2', label: '3-5-2' },
            { value: '3-4-3', label: '3-4-3' },
            { value: '4-2-3-1', label: '4-2-3-1' }
        ]
    };

    const currentFormations = formations[gameFormat] || formations['5x5'];

    return (
        <Form layout="vertical">
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label={t('game.formation.teamA')}>
                        <Select
                            value={formationA || currentFormations[0].value}
                            onChange={(val) => onFormationChange('formationA', val)}
                            disabled={!isOrganizer}
                        >
                            {currentFormations.map(f => (
                                <Option key={f.value} value={f.value}>{f.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label={t('game.formation.teamB')}>
                        <Select
                            value={formationB || currentFormations[0].value}
                            onChange={(val) => onFormationChange('formationB', val)}
                            disabled={!isOrganizer}
                        >
                            {currentFormations.map(f => (
                                <Option key={f.value} value={f.value}>{f.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};

export default FormationSelector;
