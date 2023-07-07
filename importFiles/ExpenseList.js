import * as React from 'react';
import './ExpensesList.scss';
import './DragNDropExpenseList.scss';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { Dispatch, SetStateAction } from 'react';
import CheckBox from '../common/CheckBox/CheckBox';
import { ExpenseDragNDrop } from './ExpenseInfo/ExpenseDragNDrop';
import { l } from 'client/Other/Translation';
import Search from 'client/components/common/Search/Search';
import Button, { ButtonType } from 'client/components/common/Button/Button';
import {InfiniteList, EmptyView, SORT_ORDER, ListActions, Menu, MenuItem } from 'client/components/common/List';
import { ExpensesOrder, ExpensesOrderType, ExpenseTransaction }
    from 'client/Interfaces/Expenses/ExpensesInterface';
import { ColumnType } from 'client/components/common/List/ListInterface';
import { getCategoryName, getDisplayName } from 'client/components/banking/helpers';
import { formatDate } from 'client/Other/functions/dateFunctions';
import { ChipVariant } from 'client/components/common/Chip/Chip';
import { useTypedSelector } from 'client/reducer';
import { longDateSelector } from 'client/reducers/settings';
import { getExpenses, resetExpenses, uploadAttachment, setAtttachmentLoading, undeleteAllExpenses }
    from 'client/actions/expenseActions';
import { useDebounce } from 'client/hooks/useDebounced';
import { Analytics } from 'client/Global/Analytics';
import { navigateAddModal, navigateRemoveModal, setNavigationPath } from 'client/actions/navigation';
import liveTime from 'client/components/common/LiveTime/LiveTime';



export const transactionStatusChipVariantMap = {
    APPROVED: ChipVariant.green,
    REVIEW: ChipVariant.gray,
};



export const ExpenseList = ({
    selectedExpenseId,
    selectedMultipleExpenses,
    formatCurrency,
    onOpenConnectBankModal,
    openDeleteConfirmationModal,
    setSelectedMultipleExpenses
}) => {
    const dispatch = useDispatch();
    const locale = useTypedSelector((state) => state.token.locale);
    const dateFormat = useTypedSelector((state) => longDateSelector(state));
    const { selectedBankAccounts: selectedAccounts } = useTypedSelector((state) => state.banking);
    const [searchValue, setSearchValue] = React.useState('');
    const { bank, status: bankAccountStatus } = useTypedSelector((state) => state.bankWithAccounts);
    const { transactions, totalAmount, totalElements, elementCountWithoutAttachment, bankRequestStatus, loaded,
        deletedElements } = useTypedSelector((state) =>  { return {...state.expenses};});
    const {status: transactionStatus } = useTypedSelector((state) => state.bankTransactions);
    const [ currentPage, setPage ] = React.useState(0);
    const [ currentSize, setSize ] = React.useState(50);
    const [ hasLoadedOnce, setHasLoadedOnce ] = React.useState(false);
    const [ hasFailedOnce, setHasFailedOnce ] = React.useState(false);
    const [ isMultiSelectActive, setIsMultiSelectActive ] = React.useState(false);
    const [ order, setOrder ] = React.useState({orderBy: 'bookingdate', orderByType: 'desc'});
    const [ filteredByReceipt, setFilterByReceipt ]= React.useState(false);
    const [ filteredByDeleted, setFilterByDeleted ]= React.useState(false);
    const debouncedSearchTerm = useDebounce(searchValue, 1000);
    const total = totalElements ? totalElements : 0;
    const totalMissing = elementCountWithoutAttachment? elementCountWithoutAttachment : 0;
    const [dragActivedItem, setDragActivedItem] = React.useState('');
    const rowRef = React.useRef({});
    const updateTime = React.useMemo(() => moment(), []);
    const componentTime = liveTime(updateTime, 1000);
    const selectedExpense = useTypedSelector((state) =>
        state?.expenses?.transactions.find((t)=>t?.id === selectedExpenseId));
    const usePrevious = (value, initialValue) => {
    const ref = React.useRef(initialValue);
    React.useEffect(() => {
        ref.current = value;
    });
    return ref.current;
    };
    const previousDebouncedSearchTerm = usePrevious(debouncedSearchTerm, []);

    const handleRowSelect = (row) => {
        dispatch(setNavigationPath(row?.id === selectedExpenseId ? '/expenses' : `/expenses/${row?.id}`));
    };

    React.useEffect(() => {
        if(debouncedSearchTerm !== previousDebouncedSearchTerm) {
            Analytics.trackEvent('searchExpenses' , {
                type: 'action', category: 'expense', result: 'success', placement: 'expenses',
            });
        }
        dispatch(resetExpenses());
        dispatch(getExpenses(currentPage, currentSize, order.orderBy,
            order.orderByType,  debouncedSearchTerm ,filteredByReceipt, filteredByDeleted, true ));
    }, [dispatch, order, filteredByReceipt, filteredByDeleted, debouncedSearchTerm]);


    const getNewExpensesFromBank = () => {
        if (bankAccountStatus === 'succeed' && Boolean(bank) && transactionStatus !== 'expired' ) {
            const retriveNew = true;
            dispatch(resetExpenses());
            dispatch(getExpenses(currentPage, currentSize, order.orderBy, order.orderByType, '',
                filteredByReceipt, filteredByDeleted, retriveNew));
            Analytics.trackEvent('fetchExpenses', {
                type: 'action', category: 'expenses', result: 'success', placement: 'expenses'
            });
        } else if (bankAccountStatus === 'loading') {
            return;
        } else {
            onOpenConnectBankModal();
            Analytics.trackEvent('connectBankModal', {
                type: 'action', category: 'bankConnection', result: 'open',
                button: 'fetchExpenses', placement: 'expenses'
            });
        }
    };

    const getNextPageExpenses = () => {
        if(transactions.length<Number(total)) {
            const nextPage = currentPage + 1;
            setPage(nextPage);
            dispatch(getExpenses(nextPage, currentSize, order.orderBy,order.orderByType,
                searchValue,filteredByReceipt, filteredByDeleted, false));
        }
    };

    const handleDrag = (e, id) => {
        if ('preventDefault' in e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if ((e.type === 'dragenter' || e.type === 'dragover') && id ) {
            setDragActivedItem(id);
        } else if (e.type === 'dragleave' && dragActivedItem) {
            setDragActivedItem('');
        }
    };

    const handleOnUpload = (id, files) => {
        const file = files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                Analytics.trackEvent('addExpenseReceipt', {
                    type: 'action', category: 'expense', result: 'success', placement: 'expenses',
                    expenseID: id ? id : null,
                    location: 'list',
                    method: 'click',
                });
                const thumbnail = file.type.includes('image') ? reader.result
                    : '';
                dispatch(setAtttachmentLoading(selectedExpense));
                dispatch(uploadAttachment(id, file, thumbnail));
            };
    };

    const handleFileSelect = (e, id) => {
        const expense = transactions?.filter((e)=>e?.id === id)[0];
        if (expense) {
            const attachmentExist=  expense.attachments?.length > 0;
            handleDrag(e, id);
            if( e.type === 'dragenter' || e.type === 'dragover') {
                return;
            }
            if(!selectedExpense || selectedExpenseId !== id) {
                rowRef.current[id].click();
            }
            const files = e.dataTransfer?.files? Array.from(e.dataTransfer.files) : e.target?.files;
            if (files && !attachmentExist) {
                handleOnUpload(id, files);
            }
            setDragActivedItem('');
        }
    };

    const checkNextOrderType = (orderType) => {
        Analytics.trackEvent('orderExpenses', {
            type: 'action', category: 'expenses', result: 'success', placement: 'expenses',
            column: orderType, direction: order.orderByType === 'desc' ? 'asc' : 'desc'
        });
        if (orderType !== order.orderBy && orderType === 'bookingdate') {
            return 'desc';
        } else if (orderType !== order.orderBy) {
            return 'asc';
        }
        return order.orderByType === 'desc' ? 'asc' : 'desc';
    };

    const openEditingExpenseModal = (row) => {
        dispatch(
            navigateAddModal({
                component: 'EditExpenseModal',
                props: {
                    selectedExpense: row ? row : null,
                    isOpen: true,
                    originExpense: null,
                    receiptThumbnail: '',
                    imgLink: '',
                    formatCurrency: formatCurrency,
                    onClose: () => dispatch(navigateRemoveModal('EditExpenseModal')),
                    onSave: () => {
                        dispatch(navigateRemoveModal('EditExpenseModal'));
                    }
                }
            })
        );
    };

    const columns = React.useMemo(()=> [
        {
            key: 'attachment',
            label: l('expenseList.columnHeader.receipt'),
            useCallback: true,
            sortable: !filteredByReceipt,
            sortFunction: () => 1,
            cellRenderer: (row) => {
                const attachmentExist = row?.attachments?.length > 0 && row?.attachments[0]?.id;
                if (attachmentExist) {
                    return (
                        <div className={'list_matched'}></div>
                    );
                } else {
                const dragActived = dragActivedItem === row.id;
                    return (
                        <ExpenseDragNDrop
                            rowRef={rowRef}
                            cName={'list'}
                            data={row}
                            label=""
                            dragActived={dragActived}
                            handleFileSelect={(e)=> handleFileSelect(e, row.id)}
                        />
                    );
                }
            },
            callback: ()=> {
                const nextOrderType = checkNextOrderType('attachments');
                setPage(0);
                setOrder({orderBy: 'attachments', orderByType: nextOrderType});
            }
        },
        {
            key: 'customer',
            label: l('expenseList.columnHeader.payment'),
            sortable: true,
            useCallback: true,
            sortFunction: (a, b) => (getDisplayName(a) > getDisplayName(b) ? 1 : -1),
            formatter: (row) => getDisplayName(row),
            callback: ()=> {
                const nextOrderType = checkNextOrderType('vendor');
                setPage(0);
                setOrder({orderBy: 'vendor', orderByType: nextOrderType});
            }
        },
        {
            key: 'category',
            label: l('expenseList.columnHeader.category'),
            sortable: true,
            useCallback: true,
            sortFunction: () => 1,
            formatter: (row) => getCategoryName(row),
            callback: ()=> {
                const nextOrderType = checkNextOrderType('category');
                setPage(0);
                setOrder({orderBy: 'category', orderByType: nextOrderType});
            }
        },
        {
            key: 'bookingDate',
            label: l('expenseList.columnHeader.date'),
            sortable: true,
            useCallback: true,
            formatter: (row) => formatDate(row?.bookingDate, dateFormat, locale.split('_')[0]),
            callback: ()=> {
                const nextOrderType = checkNextOrderType('bookingdate');
                setPage(0);
                setOrder({orderBy: 'bookingdate', orderByType: nextOrderType});
            }
        },
        {
            key: 'total',
            label: l('expenseList.columnHeader.total'),
            sortable: true,
            useCallback: true,
            sortFunction: (a, b) => (a.transactionAmount.amount > b.transactionAmount.amount ? 1 : -1),
            formatter: (row) => formatCurrency(row?.transactionAmount?.amount),
            callback: ()=> {
                const nextOrderType = checkNextOrderType('amount');
                setPage(0);
                setOrder({orderBy: 'amount', orderByType: nextOrderType});
            }
        }
    ], [selectedMultipleExpenses]);

    const UpdateTimeComponent = () => {
        const success = <div className={'UpdateTime'}>{l('expenseList.timeUpdate')} {componentTime}</div>;
        const failure = <div className={'UpdateTime'}>
            <span className={'Update_error'}>{l('expenseList.timeUpdate.error')}</span>
            <Button
                type={ButtonType.link}
                label={l('expenseList.fetch.retry')}
                automation={'expenseList.fetch.retry'}
                action={()=>getNewExpensesFromBank()}
            />
        </div>;

        if(hasLoadedOnce){
            return success;
        }
        if (hasFailedOnce) {
            return failure;
        }

        if (bankRequestStatus !== 'FAILED_NEED_CONSENT' && bank) {
            if (bankRequestStatus === 'FAILED_GENERAL') {
                setHasFailedOnce(true);
                return failure;
            } else if (
                bankRequestStatus === 'OK'
                && bankAccountStatus !== 'loading'
                && loaded) {
                setHasLoadedOnce(true);
                return success;
            }
        }

        return <></>;
    };

    const onMultiSelect = (ids) => {
        const selectedIDs =  ids.map((id)=>String(id));
        setSelectedMultipleExpenses(selectedIDs);
    };

    const listActionsKey = 'listActions';
    const emptyViewActionsKey = 'emptyView';

    return (
        <div className={'ExpenseList'}>
            <div className={'TopPart'}>
                <div className={'ListHeader'}>
                    <div className={'ListTitleBlock'}>
                        <h1>{l('expenseList.title')}</h1>
                        <UpdateTimeComponent/>
                    </div>
                    <Search
                        className={['Search', 'Text']}
                        value={searchValue}
                        placeholder={l('search.Default')}
                        automation={'expenses-list-search-input'}
                        onChange={(value) => {
                            const trimValue = value.replace(/[^\w\s]/gi, '');
                            setPage(0);
                            setSearchValue(trimValue);
                        }}
                    />
                    <Button
                        type={ButtonType.accept}
                        className={'ListTitleButton'}
                        label={l('expenseList.addExpense')}
                        automation={'addExpenseButton-expenses'}
                        action={()=> {
                            openEditingExpenseModal();
                            Analytics.trackEvent('addExpense', {
                                type: 'action', category: 'expense', result: 'open', placement: 'expenses'
                            });
                        }}
                    />
                </div>
                <div className={'FilterButtons'}>
                    <Button
                        automation={'expenses-list-filter-all-button'}
                        label={`${l('expenseList.filter.all')} (${total})`}
                        selected={!filteredByReceipt && !filteredByDeleted}
                        type={ButtonType.filter}
                        action={()=> {
                            Analytics.trackEvent('switchTab' , {
                                type: 'action', category: 'expense', result: 'success', placement: 'expenses',
                                tab: 'All'
                            });
                            setPage(0);
                            setSelectedMultipleExpenses([]);
                            setFilterByReceipt(false);
                            setFilterByDeleted(false);
                        }}
                    />
                    <Button
                        automation={'expenses-list-filter-missing-button'}
                        label={`${l('expenseList.filter.missing')} (${totalMissing})`}
                        selected={filteredByReceipt}
                        type={ButtonType.filter}
                        action={()=> {
                            Analytics.trackEvent('switchTab' , {
                                type: 'action', category: 'expense', result: 'success', placement: 'expenses',
                                tab: 'Missing receipts'
                            });
                            setPage(0);
                            setSelectedMultipleExpenses([]);
                            setFilterByReceipt(true);
                            setFilterByDeleted(false);
                        }}
                    />
                    <Button
                        automation={'expenses-list-filter-archived-button'}
                        label={`${l('expenseList.filter.archived')} (${deletedElements ? deletedElements : 0})`}
                        selected={filteredByDeleted}
                        type={ButtonType.filter}
                        action={()=> {
                            Analytics.trackEvent('switchTab' , {
                                type: 'action', category: 'expense', result: 'success', placement: 'expenses',
                                tab: 'Archived'
                            });
                            setPage(0);
                            setSelectedMultipleExpenses([]);
                            setFilterByReceipt(false);
                            setFilterByDeleted(true);
                        }}
                    />
                </div>
            </div>
            <div className={'MiddlePart'}>
                <InfiniteList
                    isLoading={bankAccountStatus === 'idle' ||
                                bankAccountStatus === 'succeed' && !loaded ||
                                bankAccountStatus === 'loading'}
                    automation={'expenses-list'}
                    data={transactions?.length >0 && Object.keys(transactions[0])?.length > 0 ? transactions : []}
                    columns={columns}
                    rowHeight={60}
                    defaultSortColumn={'receipt'}
                    defaultSortOrder={SORT_ORDER.DESC}
                    onRowClick={(row) => handleRowSelect(row)}
                    activeRow={(selectedExpenseId && !(selectedMultipleExpenses && selectedMultipleExpenses.length)) ?
                        selectedExpenseId : null}
                    hasNextPage= {true}
                    isNextPageLoading={true}
                    loadNextPage = {getNextPageExpenses}
                    listActionsKey={listActionsKey}
                    emptyViewActionsKey={emptyViewActionsKey}
                    dragActivedItem = {dragActivedItem}
                    handleDrag={handleDrag}
                    handleFileSelect={handleFileSelect}
                    multiSelectedValue={selectedMultipleExpenses}
                    multiSelectable={isMultiSelectActive}
                    onMultiSelect={onMultiSelect}
                    multiSelectContextHeader={filteredByDeleted ? (
                        <div key={'multiRowsActions'} className={'multiselectActions'} style={{ flexGrow: 1 }}>
                            <Button
                                automation={'expenses-list-store-all-button'}
                                label={l('expense.restoreAll')}
                                type={ButtonType.link}
                                action={()=> {
                                    Analytics.trackEvent('restoreAll' , {
                                        type: 'action', category: 'expense', result: 'success', placement: 'expenses',
                                        tab: 'Deleted'
                                    });
                                    dispatch(undeleteAllExpenses(selectedMultipleExpenses));
                                    setSelectedMultipleExpenses([]);
                                }}/>
                        </div>):(
                        <div key={'multiRowsActions'} className={'multiselectActions'} style={{ flexGrow: 1 }}>
                            <Button
                                automation={'expenses-list-delete-all-button'}
                                label={l('expense.deleteAll')}
                                selected={!filteredByReceipt && !filteredByDeleted}
                                type={ButtonType.link}
                                action={()=> {
                                    Analytics.trackEvent('deleteAll' , {
                                        type: 'action', category: 'expense', result: 'success', placement: 'expenses',
                                        tab: filteredByReceipt ? 'Missing Receipt' : 'All'
                                    });
                                    openDeleteConfirmationModal();}}/>
                        </div>
                    )}
                >
                        <ListActions key="listActions">
                            {() => (
                                    <Menu>
                                        <MenuItem onClick={() =>
                                            dispatch(setNavigationPath('/reactReports/expenseReport'))
                                        }>
                                            {l('expenseList.expenseReport')}
                                        </MenuItem>
                                        <MenuItem onClick={() => {
                                            setSelectedMultipleExpenses([]);
                                            setIsMultiSelectActive(!isMultiSelectActive);
                                        }}>
                                            <CheckBox
                                                value={isMultiSelectActive}
                                                label={<div className="multiselect-toggle-label">&nbsp;{l('expenseList.multiselect')}</div>}
                                                labelPosition="right"
                                                className="multiselect-toggle"
                                                onChange={() => {return;}}
                                            />
                                        </MenuItem>
                                    </Menu>
                                )}
                        </ListActions>
                        <EmptyView key="emptyView">
                            <div className="ExpensesListEmptyState">
                                <div className="ExpensesListEmptyStateIcon" />
                                <h1>{l('expenseList.empty.title')}</h1>
                                <p>{l('expenseList.empty.body')}</p>
                            </div>
                        </EmptyView>
                </InfiniteList>
            </div>
            <div className="BottomPart">
                <div className="transactions-total-label">{l('expenseList.total')}</div>
                <div className="transactions-total">
                    {formatCurrency(Number(totalAmount))}
                </div>
            </div>
        </div>
    );
};

export default ExpenseList;

