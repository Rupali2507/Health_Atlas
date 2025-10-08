package com.healthatlas.spring.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
@Table(name = "datamodel")
public class DataModel{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "npi")
    private String npi;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name  = "zip_code")
    private String zipCode;

    @Column(name = "phone_number")
    private String phoneNumber;

    public DataModel(){

    }

    public DataModel(String npi, String fullName, String address, String city,
    String state, String zipCode, String phoneNumber){
        this.npi = npi;
        this.fullName =fullName;
        this.address = address;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.phoneNumber = phoneNumber;
    }

    public long getId(){
        return id;
    }

    public void setId(long id){
        this.id = id;
    }
    public String getNpi(){
        return npi;
    }

    public void setNpi(String npi) {
        this.npi = npi;
    }

    public String getFullName(){
        return fullName;
    }

    public void setFullName(String fullName){
        this.fullName = fullName;
    }

    public String getAddress(){
        return address;
    }

    public void setAddress(String address){
        this.address = address;
    }

    public String getCity(){
        return city;
    }

    public void setCity(String city){
        this.city = city;
    }

    public String getState(){
        return state;
    }

    public void setState(String state){
        this.state = state;
    }

    public String getZipCode(){
        return zipCode;
    }

    public void setZipCode(String zipCode){
        this.zipCode = zipCode;
    }

    public String getPhoneNumber(){
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber){
        this.phoneNumber = phoneNumber;
    }

}


