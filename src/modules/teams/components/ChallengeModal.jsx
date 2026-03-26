import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, TimePicker, Input, message, Select, Spin, Empty, Alert } from 'antd';
import dayjs from 'dayjs';
import { useGetDistrictsQuery } from '../../../store/locationsApi';
import { useLazyGetStadiumsQuery, useLazyGetStadiumSlotsQuery } from '../../../store/stadiumsApi';
import { useTranslation } from 'react-i18next';

const ChallengeModal = ({
    visible,
    onCancel,
    onSend,
    confirmLoading,
    challengedTeamName,
    challengerTeams = [],  // Teams where user is captain
    selectedTeam,
    onTeamSelect
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const { data: districts, isLoading: isLoadingDistricts } = useGetDistrictsQuery();
    const [getStadiums, { data: stadiums, isFetching: isFetchingStadiums }] = useLazyGetStadiumsQuery();
    const [getSlots, { data: slots, isFetching: isFetchingSlots }] = useLazyGetStadiumSlotsQuery();

    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedStadium, setSelectedStadium] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    // Watch for district changes to fetch stadiums
    const handleDistrictChange = (value) => {
        setSelectedDistrict(value);
        form.setFieldsValue({ stadium: null, time: null });
        getStadiums({ district: value });
    };

    // Watch for stadium/date changes to fetch slots
    const handleStadiumChange = (value) => {
        setSelectedStadium(value);
        form.setFieldsValue({ time: null });
        if (selectedDate) {
            getSlots({ stadiumId: value, date: selectedDate.format('YYYY-MM-DD') });
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        form.setFieldsValue({ time: null });
        if (selectedStadium && date) {
            getSlots({ stadiumId: selectedStadium, date: date.format('YYYY-MM-DD') });
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const selectedStadiumObj = stadiums?.find(s => s.id === values.stadium);
            const challengeData = {
                date: values.date.format('YYYY-MM-DD'),
                time: values.time,
                location: selectedStadiumObj ? selectedStadiumObj.name : values.stadium,
                stadiumId: values.stadium,
                district: values.district,
                format: values.format,
                message: values.message
            };
            onSend(challengeData);
            form.resetFields();
            setSelectedDistrict(null);
            setSelectedStadium(null);
            setSelectedDate(null);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title={t('teams.challenge.title', { name: challengedTeamName })}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={confirmLoading}
            okText={t('teams.challenge.sendBtn')}
            cancelText={t('teams.challenge.cancelBtn')}
        >
            <Form form={form} layout="vertical">
                {/* Team Selection for challengers with multiple teams */}
                {challengerTeams.length > 1 && (
                    <Form.Item
                        label={t('teams.challenge.selectYourTeam')}
                        required
                    >
                        <Select
                            placeholder={t('teams.challenge.yourTeamLabel')}
                            value={selectedTeam?.id}
                            onChange={(value) => {
                                const team = challengerTeams.find(t => t.id === value);
                                onTeamSelect && onTeamSelect(team);
                            }}
                        >
                            {challengerTeams.map(team => (
                                <Select.Option key={team.id} value={team.id}>
                                    {team.name} ({team.rating || 1000} MMR)
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                {challengerTeams.length === 1 && (
                    <Alert
                        message={t('teams.challenge.challengingAs', { name: challengerTeams[0].name })}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Form.Item
                    name="district"
                    label={t('teams.challenge.locationLabel')}
                    rules={[{ required: true, message: t('teams.challenge.districtPlaceholder') }]}
                >
                    <Select
                        placeholder={t('teams.challenge.districtPlaceholder')}
                        onChange={handleDistrictChange}
                        loading={isLoadingDistricts}
                    >
                        {districts?.map(d => (
                            <Select.Option key={d.id || d} value={d.name || d}>{d.name || d}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="stadium"
                    label={t('teams.challenge.stadiumLabel')}
                    rules={[{ required: true, message: t('teams.challenge.stadiumPlaceholder') }]}
                >
                    <Select
                        placeholder={t('teams.challenge.stadiumPlaceholder')}
                        onChange={handleStadiumChange}
                        loading={isFetchingStadiums}
                        disabled={!selectedDistrict}
                        notFoundContent={isFetchingStadiums ? <Spin size="small" /> : <Empty description={t('teams.challenge.noStadiums')} />}
                    >
                        {stadiums?.map(s => (
                            <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="date"
                    label={t('common.date')}
                    rules={[{ required: true, message: t('teams.challenge.datePlaceholder') }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        onChange={handleDateChange}
                        disabled={!selectedStadium}
                        placeholder={t('teams.challenge.datePlaceholder')}
                    />
                </Form.Item>

                <Form.Item
                    name="time"
                    label={t('teams.challenge.slotLabel')}
                    rules={[{ required: true, message: t('teams.challenge.slotPlaceholder') }]}
                >
                    <Select
                        placeholder={t('teams.challenge.slotPlaceholder')}
                        loading={isFetchingSlots}
                        disabled={!selectedStadium || !selectedDate}
                        notFoundContent={isFetchingSlots ? <Spin size="small" /> : <Empty description={t('teams.challenge.noSlots')} />}
                    >
                        {slots?.map(slot => (
                            <Select.Option key={slot.time} value={slot.time} disabled={!slot.available}>
                                {slot.time} {slot.price} AZN
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="format"
                    label={t('teams.challenge.formatLabel')}
                    initialValue="7x7"
                    rules={[{ required: true, message: t('game.create.validation.selectFormat') }]}
                >
                    <Select>
                        <Select.Option value="5x5">5x5</Select.Option>
                        <Select.Option value="6x6">6x6</Select.Option>
                        <Select.Option value="7x7">7x7</Select.Option>
                        <Select.Option value="8x8">8x8</Select.Option>
                        <Select.Option value="9x9">9x9</Select.Option>
                        <Select.Option value="11x11">11x11</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="message"
                    label={t('teams.challenge.messageLabel')}
                >
                    <Input.TextArea rows={3} placeholder={t('teams.challenge.messagePlaceholder')} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ChallengeModal;
