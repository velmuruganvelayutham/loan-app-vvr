import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import axios from "axios";
import { baseURL } from "../utils/constant";
import { useTranslation } from "react-i18next";
import ReactToPrint from 'react-to-print';
import PlaceHolder from "../components/spinner/placeholder";
import Ledger from '../Reports/Ledger';
import Chart from "./Charrt";
import AsyncSelect from 'react-select/async';
import {
    useAuth
} from "@clerk/clerk-react";
import { endOfWeek } from "../FunctionsGlobal/StartDateFn";

var loannumberprocess = "";
function LedgerForm() {
    const { getToken } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loanDetails, setLoanDetails] = useState([]);
    const [loannumbers, setLoannumbers] = useState([]);
    const [loanno, setLoanno] = useState("");
    const { t } = useTranslation();
    const [company, setCompany] = useState([]);
    const componentRef = useRef();
    const reportType = useRef(0);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const token = await getToken();
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get(`${baseURL}/company/get`).then((res) => {
                setCompany(res.data);
                setIsLoading(false);
                setErrorMessage("");
            }).catch(error => {
                console.log("error=", error);
                setErrorMessage(t('errorcompany'));
                setIsLoading(false);
            })
        }
        fetchData();
    }, [getToken, t])


    useEffect(() => {

        async function fetchData() {
            setIsLoading(true);
            const token = await getToken();
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get(`${baseURL}/loancreate/get?q=`).then((res) => {
                setLoannumbers(res.data);
                
                setIsLoading(false);
                setErrorMessage("");
            }).catch(error => {
                console.log("error=", error);
                setErrorMessage(t('errormessageloan'));
                setIsLoading(false);
            })
        }
        fetchData();

    }, [getToken, t])
    const handlePrint = () => {
        window.print()
    }
    const options = loannumbers.map((loan, i) => {
        return {
            label: loan.loannumber + '-' + loan.customer,
            value: loan.loannumber,
            key: i
        }
    })
    const loadOptions = async (inputValue, callback) => {
        try {
            // Make an API call to fetch options based on the inputValue
            const token = await getToken();
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await axios.get(`${baseURL}/loancreate/get?q=${inputValue}`);
            const data = await response.data;
            // Map the fetched data to the format expected by React Select
            const options = data.map(item => ({
                value: item.loannumber,
                label: item.loannumber + '-' + item.customer,
            }));
            setLoannumbers(data);
            // Call the callback function with the options to update the dropdown
            callback(options);
        } catch (error) {
            console.error('Error fetching options:', error);
            callback([]);
        }
    };
    const processList = async (loannumber = null, nextloanactive = 0) => {

        setIsLoading(true);
        setIsLoadingLedger(true);
        var passingreportname = "ledger";
        const token = await getToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        loannumberprocess = Number(nextloanactive) === 1 ? loannumber : loanno;
        //alert(loannumberprocess);
        // alert(reportType);
        if ((Number(reportType.current.value)) === 1) {
            passingreportname = "chart"
        }
        else {
            passingreportname = "ledger"
        }
        
        return (
            axios.get(`${baseURL}/${passingreportname}/get`, { params: { loanno: Number(nextloanactive) === 1 ? loannumber : loanno, todate: new Date(endOfWeek()) } }).then((res) => {
                setLoanDetails(res.data);
                //console.log(res.data);
                setIsLoading(false);
                setErrorMessage("");
            })
                .catch(error => {
                    console.log("error=", error);
                    setErrorMessage(t('errormessageledger'));
                    setIsLoading(false);
                }).finally(()=> {
                    setIsLoadingLedger(false)
                })
        )
    }
    const renderLedgerList = (
        <Row ref={componentRef}>
            {isLoadingLedger ? (
                <div className="skeleton-loader">{t('loadingledger')}</div>
            ) : (<Ledger loanno={loannumberprocess} ledger={loanDetails}
                company={company.length > 0 ? company[0].companyname : ""} date={new Date()} />)
            }
        </Row>
    )
    const renderChart = (
        <Row ref={componentRef}>
            {isLoadingLedger ? (
                <div className="skeleton-loader">{t('loadingchart')}</div>
            ):(<Chart loanno={loannumberprocess} ledger={loanDetails}
                company={company.length > 0 ? company[0].companyname : ""} date={new Date()} />)
            }
        </Row>
    )
    const handleChange = (selectedOption) => {
        setLoanno(selectedOption.value);
        setSelectedOption(selectedOption);
    };

    const handleNextPrev = async (val=0) => {
        setIsLoading(true);
        const currentLoanNo = loanno; // Get the current loan number
       
        const nextLoanNo = (Number(val)===1)?currentLoanNo + 1:currentLoanNo - 1; // Increment the loan number

        // Fetch the next loan
        const token = await getToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
            const response = await axios.get(`${baseURL}/loancreate/get?q=${nextLoanNo}`);
            const nextLoan = response.data[0]; // Assuming the API returns an array

            if (nextLoan) {
                const formattedLoan = {
                    value: nextLoan.loannumber,
                    label: `${nextLoan.loannumber} - ${nextLoan.customer}`,
                };
                setLoanno(nextLoanNo);
                setSelectedOption(formattedLoan);

                processList(nextLoanNo, 1);
            } else {
                alert(t('nextloannotfound'));
            }
            setIsLoading(false);
            setErrorMessage("");
        } catch (error) {
            console.log("error=", error);
            setErrorMessage(t('errormessagefetchloanno'));
            setIsLoading(false);
        }
    };
    
    return (
        <Container>
            <Row className="justify-content-md-center mt-5 ">
                <Form>
                    <Row>
                        <Col xs={12} md={4} className="rounded bg-white">

                            <Form.Group className="mb-3" name="linenumber" border="primary" >
                                <Form.Label>{t('loanno')}</Form.Label>
                                <AsyncSelect autoFocus
                                    id="react-select-3-input"
                                    isLoading={isLoading}
                                    value={selectedOption}
                                    onChange={handleChange}
                                    defaultOptions={options}
                                    placeholder={t('loanplaceholdercombo')}
                                    loadOptions={loadOptions} />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={4} className="rounded bg-white">
                            <Form.Group className="mb-3" name="cityname" border="primary" >
                                <Form.Label>{t('report')}</Form.Label>
                                <Form.Select aria-label="Default select example"
                                    ref={reportType} defaultValue={0}>
                                    <option value={0} >{t('ledger')}</option>
                                    <option value={1}>{t('chart')}</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={4} className="rounded bg-white">
                        </Col>
                    </Row>
                    <Row className="rounded bg-white">
                        <Col className="col-md-1"></Col>
                        <Col className="col-md-5" >
                            <Button variant="primary" size="lg" type="button" className="text-center" onClick={handleNextPrev}>
                                {t('pageprev')}
                            </Button>{'    '}
                            <Button variant="primary" size="lg" type="button" className="text-center" onClick={processList}>
                                {t('processbuttonlabel')}
                            </Button>{'    '}

                            <Button variant="primary" size="lg" type="button" className="text-center" onClick={() => handleNextPrev(1)}>
                                {t('pagenext')}
                            </Button>
                        </Col>
                        <Col className="col-md-6 mb-4 " >
                            <ReactToPrint trigger={() => (
                                <Button variant="primary" size="lg" type="button" className="text-center" onClick={() => handlePrint}>
                                    {t('printbutton')}
                                </Button>

                            )}
                                content={() => componentRef.current} />

                        </Col>
                    </Row>
                    <Row className="rounded bg-white">
                        {isLoading ? <PlaceHolder /> : Number(reportType.current.value) === 0 ? renderLedgerList : renderChart}
                        {errorMessage && <div className="error">{errorMessage}</div>}
                    </Row>

                </Form>
            </Row>
        </Container>
    )
}
export default LedgerForm;