import React from 'react';
import { cn } from '../utils/cn';

interface Column<T> {
    key: string;
    title: string;
    dataIndex: keyof T;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    width?: string | number;
}

interface GlassTableProps<T> {
    columns: Column<T>[];
    dataSource: T[];
    rowKey?: keyof T;
    loading?: boolean;
    onRowClick?: (record: T) => void;
    className?: string;
}

export function GlassTable<T extends Record<string, any>>({
    columns,
    dataSource,
    rowKey = 'id' as keyof T,
    loading = false,
    onRowClick,
    className,
}: GlassTableProps<T>) {
    return (
        <div className={cn('glass-effect rounded-xl overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* Header */}
                    <thead className="glass-effect border-b border-white/10">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-4 text-left text-sm font-semibold glass-content"
                                    style={{ width: column.width }}
                                >
                                    {column.title}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center glass-content">
                                    <div className="flex justify-center items-center gap-2">
                                        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-glass-spin" />
                                        <span>加载中...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : dataSource.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-muted-foreground glass-content">
                                    暂无数据
                                </td>
                            </tr>
                        ) : (
                            dataSource.map((record, index) => (
                                <tr
                                    key={String(record[rowKey])}
                                    className={cn(
                                        'border-b border-white/5 transition-colors duration-200',
                                        onRowClick && 'cursor-pointer hover:bg-white/5 dark:hover:bg-white/5',
                                        'glass-active'
                                    )}
                                    onClick={() => onRowClick?.(record)}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4 text-sm glass-content">
                                            {column.render
                                                ? column.render(record[column.dataIndex], record, index)
                                                : String(record[column.dataIndex])}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
