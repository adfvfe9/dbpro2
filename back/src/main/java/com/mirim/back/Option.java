package com.mirim.back;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "options")
@Getter
@Setter
@NoArgsConstructor
public class Option {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_id")
    private Integer optionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @Column(name = "category", nullable = false, length = 20)
    private String category;

    @Column(name = "option_name", nullable = false, length = 50)
    private String optionName;

    @Column(name = "extra_price", nullable = false)
    private Integer extraPrice = 0;

    public Option(Cafe cafe, String category, String optionName, Integer extraPrice) {
        this.cafe = cafe;
        this.category = category;
        this.optionName = optionName;
        this.extraPrice = extraPrice;
    }

    public Integer getOptionId() {
        return optionId;
    }

    public Cafe getCafe() {
        return cafe;
    }

    public String getCategory() {
        return category;
    }

    public String getOptionName() {
        return optionName;
    }

    public Integer getExtraPrice() {
        return extraPrice;
    }
}
