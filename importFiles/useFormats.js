import {formatDate} from 'client/Other/functions/dateFunctions';
import {useSelector} from 'react-redux';
import {longDateSelector, longDateTimeSelector} from 'client/reducers/settings';
import {useCallback} from 'react';
import {formatCurrency} from 'client/Other/functions/currencyFormatter';


const useFormats = () => {
  const {locale, userCurrency, dateFormat, dateTimeFormat} = useSelector((state) => ({
    locale: state.token.locale,
    userCurrency: state.company.currencyId,
    dateFormat: longDateSelector(state),
    dateTimeFormat: longDateTimeSelector(state)
  }));

  const formatDateString = useCallback((date) => {
    return date ? formatDate(date, dateFormat, locale.split('_')[0]) : '';
  }, [dateFormat, locale]);

  const formatDateTime = useCallback((date) => {
    return date ? formatDate(date, dateTimeFormat, locale.split('_')[0]) : '';
  }, [dateTimeFormat, locale]);

  const getCurrencyFormattedValue = useCallback((
    value,
    {currency = userCurrency, withSign = true}
  ) => {
    return formatCurrency(value, locale, currency, withSign);
  }, [locale, userCurrency]);

  return {formatDateString, formatDateTime, getCurrencyFormattedValue};
};

export default useFormats;
